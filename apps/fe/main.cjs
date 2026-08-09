const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

// Register the scheme as privileged before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let mainWindow;
let browserContext = null;
let activePage = null;

const API_BASE_URL = process.env.API_BASE_URL || 'https://crawl-website-76020801321.asia-southeast1.run.app';

const DEFAULT_CRAWLER_CONFIG = {
  initialWaitMs: 5000,
  targetPostCount: 10,
  commentButtonSelector: '[aria-label="Viết bình luận"]',
  popupWaitMs: 3000,
  popupSelector: '.__fb-light-mode.x1n2onr6.x1vjfegm',
  viewMoreText: 'Xem tất cả',
};

let crawlerStatus = {
  browserOpen: false,
  isLoggedIn: false,
  currentTask: 'idle',
  crawlingGroup: null,
};



function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('app://index.html');
    // mainWindow.webContents.openDevTools(); // Mở DevTools ở production để debug trắng màn hình
  }
}

app.whenReady().then(() => {
  // Đăng ký custom protocol để xử lý các liên kết /_nuxt khi load file
  protocol.handle('app', (request) => {
    const url = request.url;
    let pathname = '';
    try {
      pathname = new URL(url).pathname;
    } catch (e) {
      pathname = url.replace(/^app:\/\//, '');
    }
    
    if (pathname === '/' || !pathname) {
      pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, '.output/public', pathname);
    
    if (fs.existsSync(filePath)) {
      return net.fetch(pathToFileURL(filePath).toString());
    } else {
      // Fallback về index.html cho SPA Routing
      return net.fetch(pathToFileURL(path.join(__dirname, '.output/public/index.html')).toString());
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Helper sleep function
const sleep = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Check login status
async function checkLoginStatus(page) {
  if (!page) return false;
  try {
    const currentUrl = page.url();
    if (currentUrl.includes('login')) return false;
    const loggedInIndicator = await page.$('[aria-label="Your profile"], [data-testid="issue-container"]');
    return !!loggedInIndicator;
  } catch {
    return false;
  }
}

// IPC Handlers
ipcMain.on('get-api-base-url', (event) => {
  event.returnValue = API_BASE_URL;
});

ipcMain.handle('get-crawler-status', () => {
  return crawlerStatus;
});

ipcMain.handle('launch-browser', async () => {
  if (browserContext) {
    return { success: true, message: 'Browser is already running.', status: crawlerStatus };
  }

  try {
    const userDataDir = path.join(app.getPath('userData'), 'fb_user_data');
    
    browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled'],
      viewport: { width: 1366, height: 768 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const pages = browserContext.pages();
    activePage = pages.length > 0 ? pages[0] : await browserContext.newPage();

    browserContext.on('close', () => {
      browserContext = null;
      activePage = null;
      crawlerStatus.browserOpen = false;
      crawlerStatus.isLoggedIn = false;
      crawlerStatus.currentTask = 'idle';
      crawlerStatus.crawlingGroup = null;
    });

    crawlerStatus.browserOpen = true;
    crawlerStatus.currentTask = 'login_required';

    await activePage.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000, 3000);

    const isLoggedIn = await checkLoginStatus(activePage);
    crawlerStatus.isLoggedIn = isLoggedIn;

    if (isLoggedIn) {
      crawlerStatus.currentTask = 'idle';
      return { success: true, message: 'Browser launched and you are logged in.', status: crawlerStatus };
    } else {
      return {
        success: true,
        message: 'Browser launched. Please log in to Facebook in the opened browser window.',
        status: crawlerStatus,
      };
    }
  } catch (error) {
    console.error('Failed to launch browser', error);
    if (browserContext) {
      await browserContext.close().catch(() => {});
      browserContext = null;
      activePage = null;
    }
    crawlerStatus.browserOpen = false;
    crawlerStatus.isLoggedIn = false;
    crawlerStatus.currentTask = 'idle';
    return { success: false, message: `Failed to launch browser: ${error.message}` };
  }
});

// Helper for expanding comments
async function expandAllComments(page, prefix, popupSelector) {
  if (!page) return;
  const maxIterations = 50;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    // Scroll to TOP of popup
    await page.evaluate((sel) => {
      const getActivePopup = (s) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
        for (const dialog of dialogs) {
          const rect = dialog.getBoundingClientRect();
          if (rect.width > 300 && rect.height > 300) return dialog;
        }
        if (s) {
          const elements = Array.from(document.querySelectorAll(s));
          let bestMatch = null;
          for (const el of elements) {
            const hasDialog = el.getAttribute('role') === 'dialog' || 
                              el.getAttribute('aria-modal') === 'true' || 
                              el.querySelector('[role="dialog"]') !== null;
            if (hasDialog) {
              if (!bestMatch || bestMatch.contains(el)) bestMatch = el;
            }
          }
          if (bestMatch) return bestMatch;
        }
        return null;
      };
      const popup = getActivePopup(sel);
      if (popup) popup.scrollTo({ top: 0, behavior: 'instant' });
    }, popupSelector);
    await sleep(300, 500);

    const foundAny = await page.evaluate(({ prefixText, selector }) => {
      const getActivePopup = (sel) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
        for (const dialog of dialogs) {
          const rect = dialog.getBoundingClientRect();
          if (rect.width > 300 && rect.height > 300) return dialog;
        }
        if (sel) {
          const elements = Array.from(document.querySelectorAll(sel));
          let bestMatch = null;
          for (const el of elements) {
            const hasDialog = el.getAttribute('role') === 'dialog' || 
                              el.getAttribute('aria-modal') === 'true' || 
                              el.querySelector('[role="dialog"]') !== null;
            if (hasDialog) {
              if (!bestMatch || bestMatch.contains(el)) bestMatch = el;
            }
          }
          if (bestMatch) return bestMatch;
        }
        return null;
      };
      const popup = getActivePopup(selector);
      if (!popup) return false;

      const suffix = 'phản hồi';
      const allElements = popup.querySelectorAll('span, div, a');
      for (const el of allElements) {
        const text = (el.textContent || '').trim();
        if (text.includes(prefixText) && text.includes(suffix)) {
          el.click();
          return true;
        }
      }
      return false;
    }, { prefixText: prefix, selector: popupSelector });

    if (foundAny) {
      await sleep(400, 800);
    } else {
      // Scroll down half page inside popup
      const atBottom = await page.evaluate((sel) => {
        const getActivePopup = (s) => {
          const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
          for (const dialog of dialogs) {
            const rect = dialog.getBoundingClientRect();
            if (rect.width > 300 && rect.height > 300) return dialog;
          }
          if (s) {
            const elements = Array.from(document.querySelectorAll(s));
            let bestMatch = null;
            for (const el of elements) {
              const hasDialog = el.getAttribute('role') === 'dialog' || 
                                el.getAttribute('aria-modal') === 'true' || 
                                el.querySelector('[role="dialog"]') !== null;
              if (hasDialog) {
                if (!bestMatch || bestMatch.contains(el)) bestMatch = el;
              }
            }
            if (bestMatch) return bestMatch;
          }
          return null;
        };
        const popup = getActivePopup(sel);
        if (popup) return popup.scrollTop + popup.clientHeight >= popup.scrollHeight - 50;
        return true;
      }, popupSelector);

      if (atBottom) break;

      await page.evaluate((sel) => {
        const getActivePopup = (s) => {
          const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
          for (const dialog of dialogs) {
            const rect = dialog.getBoundingClientRect();
            if (rect.width > 300 && rect.height > 300) return dialog;
          }
          if (s) {
            const elements = Array.from(document.querySelectorAll(s));
            let bestMatch = null;
            for (const el of elements) {
              const hasDialog = el.getAttribute('role') === 'dialog' || 
                                el.getAttribute('aria-modal') === 'true' || 
                                el.querySelector('[role="dialog"]') !== null;
              if (hasDialog) {
                if (!bestMatch || bestMatch.contains(el)) bestMatch = el;
              }
            }
            if (bestMatch) return bestMatch;
          }
          return null;
        };
        const popup = getActivePopup(sel);
        if (popup) popup.scrollBy({ top: popup.clientHeight * 0.7, behavior: 'instant' });
      }, popupSelector);
      await sleep(300, 500);
    }
  }
}

// Extractor helper
async function extractPopupContent(page, popupSelector) {
  if (!page) return null;
  try {
    return await page.evaluate((selector) => {
      const getActivePopup = (sel) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
        for (const dialog of dialogs) {
          const rect = dialog.getBoundingClientRect();
          if (rect.width > 300 && rect.height > 300) return dialog;
        }
        if (sel) {
          const elements = Array.from(document.querySelectorAll(sel));
          let bestMatch = null;
          for (const el of elements) {
            const hasDialog = el.getAttribute('role') === 'dialog' || 
                              el.getAttribute('aria-modal') === 'true' || 
                              el.querySelector('[role="dialog"]') !== null;
            if (hasDialog) {
              if (!bestMatch || bestMatch.contains(el)) bestMatch = el;
            }
          }
          if (bestMatch) return bestMatch;
        }
        return null;
      };

        let targetElement = getActivePopup(selector);
        let foundVia = targetElement ? 'active_dialog' : 'none';

        // Fallback: find any visible popup-like element if the selector doesn't match
        if (!targetElement) {
          const popups = document.querySelectorAll('[role="dialog"], [aria-modal="true"], div[aria-label*="Viết bình"]');
          for (const popup of popups) {
            const label = popup.getAttribute('aria-label') || '';
            if (label.includes('Viết bình') || popup.getAttribute('role') === 'dialog') {
              targetElement = popup;
              foundVia = 'fallback';
              break;
            }
          }
        }

        if (!targetElement) {
          return { postContent: '', commentInnerText: '', parsedComments: [], authorName: null, foundVia: 'none' };
        }

        // Get post content from data-ad-rendering-role="story_message"
        const postMsgEl = targetElement.querySelector('[data-ad-rendering-role="story_message"]');
        const postContent = postMsgEl ? (postMsgEl.innerText || postMsgEl.textContent || '').trim() : '';

        // Get post author name
        const h2El = targetElement.querySelector('h2');
        let titleText = h2El ? (h2El.textContent || '').trim() : '';
        let authorName = null;

        if (titleText) {
          authorName = titleText;
        }

        // Fallback
        if (!authorName) {
          const authorEl = targetElement.querySelector('span[dir="auto"] a[role="link"], a[role="link"]');
          authorName = authorEl ? (authorEl.textContent || '').trim() : null;
        }

        // Get comments from the specified class name
        const commentSelector = '.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.x18d9i69.x1g0dm76.xpdmqnj.x1n2onr6';
        const commentElements = targetElement.querySelectorAll(commentSelector);
        const rawText = Array.from(commentElements)
          .map(el => (el.innerText || el.textContent || '').trim())
          .filter(Boolean)
          .join('\n');

        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

        const parsedComments = [];
        let i = 0;

        // Bắt đầu từ sau chữ "Phù hợp nhất" đầu tiên
        const firstIndex = lines.findIndex(l => l.includes('Phù hợp nhất'));
        if (firstIndex !== -1) {
          i = firstIndex + 1;
        }

        while (i < lines.length) {
          const author = lines[i];
          const content = lines[i + 1];

          // Đảm bảo tác giả và nội dung hợp lệ (không trùng với các từ khóa điều hướng)
          if (author && content && !['Thích', 'Trả lời', 'Chia sẻ'].includes(author)) {
            parsedComments.push({ author, content });
          }

          // Tìm cụm "Thích", "Trả lời", "Chia sẻ" tiếp theo
          let foundNext = false;
          for (let j = i + 2; j < lines.length - 2; j++) {
            if (lines[j] === 'Thích' && lines[j + 1] === 'Trả lời' && lines[j + 2] === 'Chia sẻ') {
              i = j + 3; // Nhảy tới tên người comment tiếp theo
              foundNext = true;
              break;
            }
          }

          if (!foundNext) {
            break;
          }
        }

        const commentInnerText = rawText;

        return { postContent, commentInnerText, parsedComments, authorName, foundVia };
    }, popupSelector);
  } catch (err) {
    console.error('Extraction error:', err);
    return null;
  }
}

ipcMain.handle('run-crawl', async (event, { groupUrl, limitPosts, token }) => {
  if (!browserContext || !activePage) {
    return { success: false, message: 'Browser is not launched.' };
  }

  const targetCount = limitPosts || DEFAULT_CRAWLER_CONFIG.targetPostCount;
  crawlerStatus.currentTask = 'crawling';
  crawlerStatus.crawlingGroup = groupUrl;

  try {
    // 1. Check/Create Group on Server first
    const groupNameMatch = groupUrl.match(/facebook\.com\/groups\/([^\/?#]+)/);
    if (!groupNameMatch) {
      throw new Error('Invalid Facebook group URL.');
    }
    const groupName = groupNameMatch[1];
    
    const groupResponse = await fetch(`${API_BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ name: groupName, url: groupUrl }),
    });
    const groupData = await groupResponse.json();
    if (!groupData.group) {
      throw new Error('Failed to synchronize group with backend.');
    }
    const groupId = groupData.group.id;

    // 2. Go to URL
    await activePage.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(DEFAULT_CRAWLER_CONFIG.initialWaitMs, DEFAULT_CRAWLER_CONFIG.initialWaitMs + 500);

    let postsCrawled = 0;
    let scrollCount = 0;
    const maxScrolls = targetCount * 5;

    while (postsCrawled < targetCount && scrollCount < maxScrolls) {
      // Find comment button
      let commentButton = null;
      const selectors = [
        `div[role="button"]:has([data-ad-rendering-role="comment_button"]):not([data-crawled="true"])`,
        `[aria-label="Viết bình luận"]:not([contenteditable="true"]):not([role="textbox"]):not([data-crawled="true"])`,
        `[aria-label*="Viết bình"]:not([contenteditable="true"]):not([role="textbox"]):not([data-crawled="true"])`,
        `[aria-label*="Comment"]:not([contenteditable="true"]):not([role="textbox"]):not([data-crawled="true"])`
      ];

      for (const sel of selectors) {
        const count = await activePage.locator(sel).count();
        if (count > 0) {
          commentButton = activePage.locator(sel).first();
          break;
        }
      }

      if (commentButton) {
        await commentButton.click({ force: true });
        await commentButton.evaluate(el => el.setAttribute('data-crawled', 'true')).catch(() => {});
        await sleep(DEFAULT_CRAWLER_CONFIG.popupWaitMs, DEFAULT_CRAWLER_CONFIG.popupWaitMs + 500);

        // Expand comments
        await expandAllComments(activePage, DEFAULT_CRAWLER_CONFIG.viewMoreText, DEFAULT_CRAWLER_CONFIG.popupSelector);

        // Extract
        const extracted = await extractPopupContent(activePage, DEFAULT_CRAWLER_CONFIG.popupSelector);

        // Close popup
        await activePage.keyboard.press('Escape');
        await sleep(500, 800);

        if (extracted && (extracted.postContent || extracted.commentInnerText)) {
          const postUrl = activePage.url() || groupUrl;
          const fbPostId = postUrl.includes('/posts/') ? postUrl.match(/\/posts\/(\d+)/)?.[1] : `post_${Date.now()}`;

          // Save to Server via API!
          await fetch(`${API_BASE_URL}/api/groups/${groupId}/posts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              fb_post_id: fbPostId || `post_${Date.now()}`,
              author_name: extracted.authorName || null,
              content: extracted.postContent,
              comment_inner_text: extracted.commentInnerText,
              comments: (extracted.parsedComments || []).map(c => ({
                author_name: c.author,
                comment_text: c.content
              })),
              post_url: postUrl,
            }),
          });

          postsCrawled++;
        }
      } else {
        // Scroll down
        await activePage.evaluate(() => {
          window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'instant' });
        });
        scrollCount++;
        await sleep(1000, 2000);
      }
    }

    crawlerStatus.currentTask = 'idle';
    crawlerStatus.crawlingGroup = null;

    return { success: true, message: `Crawl complete. Processed ${postsCrawled} posts.`, groupId };
  } catch (error) {
    console.error('Crawl failed:', error);
    crawlerStatus.currentTask = 'idle';
    crawlerStatus.crawlingGroup = null;
    return { success: false, message: `Crawl failed: ${error.message}` };
  }
});
