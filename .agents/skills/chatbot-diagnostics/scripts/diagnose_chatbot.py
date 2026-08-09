import os
import sys
import re
from datetime import datetime, timezone
import psycopg2
from google.cloud import logging as gcp_logging
from google.oauth2 import service_account

# Force UTF-8 stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Color codes for formatting
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

def load_env(env_path):
    env_vars = {}
    if not os.path.exists(env_path):
        return env_vars
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()
    return env_vars

def parse_db_url(db_url):
    # postgresql://user:password@host:port/dbname?sslmode=...
    pattern = r"postgresql://(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:/]+)(:(?P<port>\d+))?/(?P<dbname>[^?]+)"
    match = re.match(pattern, db_url)
    if not match:
        raise ValueError("Invalid DATABASE_URL format")
    return match.groupdict()

def diagnose():
    print(f"{BOLD}{CYAN}=== CHATBOT PIPELINE DIAGNOSTIC TOOL ==={RESET}\n")

    # 1. Load Environment Variables
    be_env_path = r"c:\work\tuan\bizmind-ai\apps\be\.env"
    print(f"Loading env from: {be_env_path}...")
    env = load_env(be_env_path)
    
    db_url = env.get("DATABASE_URL")
    if not db_url:
        print(f"{RED}[FAIL] DATABASE_URL not found in .env{RESET}")
        return

    # 2. Check Database Connection & Fetch Latest Messages
    latest_user_msg = None
    latest_user_time = None
    print(f"Connecting to PostgreSQL database...")
    try:
        db_params = parse_db_url(db_url)
        conn = psycopg2.connect(
            dbname=db_params['dbname'],
            user=db_params['user'],
            password=db_params['password'],
            host=db_params['host'],
            port=db_params['port'] or 5432,
            sslmode='require'
        )
        print(f"{GREEN}[OK] Database connected successfully.{RESET}")
        
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, "senderId", role, content, "createdAt" 
                FROM "FacebookChatMessage" 
                ORDER BY "createdAt" DESC 
                LIMIT 5
            """)
            rows = cur.fetchall()
            print(f"\n{BOLD}Recent Facebook Chat Messages in DB:{RESET}")
            if not rows:
                print("No messages found in DB.")
            for row in rows:
                msg_id, sender, role, content, created_at = row
                role_color = GREEN if role == 'user' else YELLOW
                print(f"  [{created_at.isoformat()}] {role_color}{role.upper()}{RESET} ({sender}): {content[:80]}")
                if role == 'user' and not latest_user_msg:
                    latest_user_msg = content
                    latest_user_time = created_at
        conn.close()
    except Exception as e:
        print(f"{RED}[FAIL] Database query failed: {e}{RESET}")

    # 3. Pull Logs from GCP Cloud Run
    key_file = r"c:\work\tuan\bizmind-ai\.gcp-key.json"
    if not os.path.exists(key_file):
        print(f"{RED}[FAIL] GCP Service Account Key not found at {key_file}{RESET}")
        return
        
    print(f"\nConnecting to GCP Cloud Logging...")
    try:
        credentials = service_account.Credentials.from_service_account_file(key_file)
        client = gcp_logging.Client(project="bizmind-ai-494514", credentials=credentials)
        
        # Pull last 100 entries of the NestJS logs
        filter_str = 'resource.type="cloud_run_revision" AND resource.labels.service_name="bizmind-ai"'
        print(f"Fetching logs from Cloud Run service 'bizmind-ai'...")
        entries = client.list_entries(filter_=filter_str, order_by=gcp_logging.DESCENDING, page_size=150)
        
        log_lines = []
        for entry in entries:
            payload = entry.payload
            if isinstance(payload, dict) and 'message' in payload:
                log_lines.append((entry.timestamp, payload['message'], entry.severity))
            elif isinstance(payload, str):
                log_lines.append((entry.timestamp, payload, entry.severity))
            elif entry.http_request:
                req = entry.http_request
                log_lines.append((
                    entry.timestamp, 
                    f"HTTP_REQ: {req.get('requestMethod')} {req.get('requestUrl')} - Status: {req.get('status')}", 
                    entry.severity
                ))
        
        # Sort logs chronologically for easier pipeline tracing
        log_lines.reverse()
        
        print(f"Successfully retrieved {len(log_lines)} log entries. Analyzing recent chatbot sessions...")
        
        # Find where the user message processing starts in the logs
        start_idx = -1
        # Scan from newest to oldest
        for idx in range(len(log_lines) - 1, -1, -1):
            ts, msg, sev = log_lines[idx]
            if "Nhận tin nhắn từ Facebook ID" in msg:
                if latest_user_msg:
                    clean_msg = latest_user_msg.lower().strip()
                    clean_log = msg.lower()
                    if clean_msg in clean_log or any(word in clean_log for word in clean_msg.split()[:3]):
                        start_idx = idx
                        break
                else:
                    start_idx = idx
                    break
        
        # If we didn't find the message match, fallback to the last webhook event
        if start_idx == -1:
            for idx in range(len(log_lines) - 1, -1, -1):
                ts, msg, sev = log_lines[idx]
                if "Nhận webhook event từ Facebook" in msg or ("HTTP_REQ: POST" in msg and "/facebook/webhook" in msg):
                    start_idx = idx
                    break

        if start_idx == -1:
            print(f"{YELLOW}[WARN] No recent chatbot transaction logs found.{RESET}")
            return
            
        print(f"\n{BOLD}{CYAN}=== TRACING CHATBOT TRANSACTION PIPELINE ==={RESET}")
        
        # Extract logs for this transaction
        tx_logs = log_lines[start_idx:]
        
        # Also scan a few lines BEFORE the start_idx to find the webhook trigger request
        pre_logs = log_lines[max(0, start_idx - 5):start_idx]
        webhook_time = None
        for ts, msg, sev in pre_logs:
            if "Nhận webhook event từ Facebook" in msg or "facebook/webhook" in msg:
                webhook_time = ts
                break
        
        stages = {
            "1. Webhook Received": {"status": "PENDING", "detail": ""},
            "2. Message Saved to DB": {"status": "PENDING", "detail": ""},
            "3. Intent Classified": {"status": "PENDING", "detail": ""},
            "4. RAG Product Query": {"status": "PENDING", "detail": ""},
            "5. AI LLM Generation": {"status": "PENDING", "detail": ""},
            "6. Send Back to Facebook": {"status": "PENDING", "detail": ""}
        }
        
        if webhook_time:
            stages["1. Webhook Received"] = {
                "status": "OK", 
                "detail": f"Time: {webhook_time.isoformat()} (UTC)"
            }
        else:
            stages["1. Webhook Received"] = {
                "status": "OK", 
                "detail": f"Time: {tx_logs[0][0].isoformat()} (UTC)"
            }
            
        user_message = "Unknown"
        sender_id = "Unknown"
        
        # Trace logs sequentially
        for ts, msg, sev in tx_logs:
            # 2. Message Saved to DB
            if "Nhận tin nhắn từ Facebook ID" in msg:
                match = re.search(r'Facebook ID: (\d+) - Nội dung: "([^"]+)"', msg)
                if match:
                    sender_id = match.group(1)
                    user_message = match.group(2)
                stages["2. Message Saved to DB"] = {
                    "status": "OK",
                    "detail": f"Sender: {sender_id}, Msg: '{user_message}'"
                }
            if "Chế độ tự động trả lời AI đang TẮT" in msg:
                stages["3. Intent Classified"] = {
                    "status": "STOPPED",
                    "detail": "AI Auto Reply is disabled in Settings."
                }
                
            # Helper to analyze LLM error details (e.g., out of token / quota / API keys)
            def analyze_llm_error(error_msg):
                error_lower = error_msg.lower()
                hint = ""
                if "insufficient_quota" in error_lower or "insufficient quota" in error_lower or "billing" in error_lower or "credit" in error_lower:
                    hint = f" {RED}{BOLD}[HẾT TIỀN/QUOTA - Tài khoản LLM hết tiền hoặc quá hạn dùng]{RESET}"
                elif "rate_limit" in error_lower or "429" in error_lower or "too many requests" in error_lower:
                    hint = f" {RED}{BOLD}[RATE LIMIT - Bị giới hạn tần suất gọi API]{RESET}"
                elif "invalid api key" in error_lower or "incorrect api key" in error_lower or "auth" in error_lower or "unauthorized" in error_lower:
                    hint = f" {RED}{BOLD}[SAI API KEY - Kiểm tra cấu hình API KEY trong file .env]{RESET}"
                return f"{error_msg}{hint}"

            # 3. Intent Classified
            if "[Intent Router] Tin nhắn được phân loại là:" in msg:
                intent = msg.split(":")[-1].strip()
                stages["3. Intent Classified"] = {
                    "status": "OK",
                    "detail": f"Intent: {intent}"
                }
            elif "Lỗi phân tích intent" in msg:
                stages["3. Intent Classified"] = {
                    "status": "FAIL",
                    "detail": analyze_llm_error(msg)
                }
                
            # 4. RAG Product Query
            if "Đã tìm thấy" in msg and "sản phẩm phù hợp từ PostgreSQL" in msg:
                stages["4. RAG Product Query"] = {
                    "status": "OK",
                    "detail": msg.strip()
                }
            elif "Lỗi ChatService pgvector RAG" in msg:
                stages["4. RAG Product Query"] = {
                    "status": "FAIL",
                    "detail": msg
                }
                
            # 5. AI LLM Generation
            if "AI phản hồi xong. Độ dài:" in msg:
                stages["5. AI LLM Generation"] = {
                    "status": "OK",
                    "detail": msg.strip()
                }
            elif "Lỗi trong quá trình processAndReply" in msg or "Lỗi ChatService handleUnknownInquiry" in msg:
                stages["5. AI LLM Generation"] = {
                    "status": "FAIL",
                    "detail": analyze_llm_error(msg)
                }
                
            # 6. Send Back to Facebook
            if "Facebook Graph API phản hồi thành công" in msg:
                stages["6. Send Back to Facebook"] = {
                    "status": "OK",
                    "detail": "Delivered successfully to Facebook API"
                }
            elif "Facebook Send API trả về lỗi" in msg or "Lỗi kết nối tới Facebook Send API" in msg:
                stages["6. Send Back to Facebook"] = {
                    "status": "FAIL",
                    "detail": msg
                }

        # Print Trace Results
        for stage, info in stages.items():
            status = info["status"]
            detail = info["detail"]
            if status == "OK":
                status_str = f"{GREEN}[OK]{RESET}"
            elif status == "FAIL":
                status_str = f"{RED}[FAIL]{RESET}"
            elif status == "STOPPED":
                status_str = f"{YELLOW}[STOPPED]{RESET}"
            else:
                status_str = f"{YELLOW}[PENDING/NO LOG]{RESET}"
                
            print(f"  {BOLD}{stage:<25}{RESET} {status_str} {detail}")
            
    except Exception as e:
        print(f"{RED}[FAIL] GCP Logs retrieval failed: {e}{RESET}")

if __name__ == "__main__":
    diagnose()
