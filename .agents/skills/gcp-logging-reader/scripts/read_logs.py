import argparse
import sys
import os
from google.cloud import logging
from google.oauth2 import service_account

def main():
    # Force UTF-8 encoding for stdout and stderr to handle unicode logs on Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')

    parser = argparse.ArgumentParser(description="Read logs from GCP Cloud Logging.")
    parser.add_argument("--project", default="bizmind-ai-494514", help="GCP Project ID")
    parser.add_argument("--key-file", default=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), ".gcp-key.json"), help="Path to Service Account Key JSON")
    parser.add_argument("--filter", default="", help="GCP Cloud Logging filter query")
    parser.add_argument("--limit", type=int, default=50, help="Max number of log entries to retrieve")
    args = parser.parse_args()

    if not os.path.exists(args.key_file):
        print(f"Error: Key file not found at {args.key_file}", file=sys.stderr)
        sys.exit(1)

    try:
        credentials = service_account.Credentials.from_service_account_file(args.key_file)
        client = logging.Client(project=args.project, credentials=credentials)
        
        print(f"Connecting to GCP Project: {args.project}...")
        print(f"Filter: {args.filter if args.filter else 'None'}")
        print(f"Fetching last {args.limit} logs...\n")
        
        filter_str = args.filter if args.filter.strip() else None
        entries = client.list_entries(
            filter_=filter_str,
            order_by=logging.DESCENDING,
            page_size=args.limit
        )
        
        count = 0
        for entry in entries:
            timestamp = entry.timestamp.isoformat() if entry.timestamp else "N/A"
            severity = entry.severity if entry.severity else "DEFAULT"
            
            message = entry.payload if entry.payload is not None else ""
                
            print(f"[{timestamp}] [{severity}] {message}")
            count += 1
            if count >= args.limit:
                break
                
        if count == 0:
            print("No logs found matching the filter criteria.")
            
    except Exception as e:
        print(f"Error connecting to GCP or reading logs: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
