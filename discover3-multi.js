const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2];

  // Launch the browser in headless mode
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set navigation timeout to a longer duration
  page.setDefaultNavigationTimeout(60000);

  // Log status messages
  const logStatus = (message) => console.log(`[Status]: ${message}`);

  try {
    logStatus('Navigating to the URL...');
    await page.goto(url, { waitUntil: 'networkidle2' });
    logStatus('Page navigation complete.');

    const dynamicElementsPresent = await checkDynamicElements(page);
    if (dynamicElementsPresent) {
      logStatus('Dynamic elements detected. Analyzing data fetching methods...');
      const dataFetchingMethods = await detectDataFetchingMethods(page);
      logStatus(`Data fetching methods detected: ${dataFetchingMethods.join(', ')}`);

      logStatus('Executing tactics based on detected data fetching methods...');
      for (const method of dataFetchingMethods) {
        await executeDataFetchingTactics(page, method);
      }
      logStatus('Tactics execution complete.');
    } else {
      logStatus('No dynamic elements detected. Proceeding with input field discovery.');
    }

    logStatus('Scrolling to load additional content...');
    await scrollPageToEnd(page);
    logStatus('Scrolling complete.');

    logStatus('Discovering input fields...');
    const inputFieldsData = await discoverInputFields(page, logStatus);
    logStatus('Input field discovery complete.');

    logStatus('Input field data:');
    console.log(inputFieldsData);
  } catch (error) {
    console.log('[Error]:', error);
  } finally {
    await browser.close();
  }
})();

// Function to check if dynamic elements are present on the page
async function checkDynamicElements(page) {
  const dynamicElements = await page.evaluate(() => {
    const dynamicElements = Array.from(document.querySelectorAll('[data-dynamic]'));
    return dynamicElements.length > 0;
  });
  return dynamicElements;
}

// Function to detect the methods used for asynchronous data fetching
async function detectDataFetchingMethods(page) {
  const dataFetchingMethods = [];

  // Method 1: Check if AJAX requests are made
  const ajaxRequestsMade = await page.evaluate(() => {
    return window.XMLHttpRequest && XMLHttpRequest.toString().indexOf('native') > -1;
  });
  if (ajaxRequestsMade) {
    dataFetchingMethods.push('AJAX requests');
  }

  // Method 2: Check if fetch API is used
  const fetchAPIUsed = await page.evaluate(() => {
    return window.fetch && fetch.toString().indexOf('native') > -1;
  });
  if (fetchAPIUsed) {
    dataFetchingMethods.push('Fetch API');
  }

  // Add more detection methods based on your specific scenarios

  return dataFetchingMethods;
}

// Function to execute tactics based on the detected data fetching method
async function executeDataFetchingTactics(page, dataFetchingMethod) {
  logStatus(`Executing tactics for ${dataFetchingMethod}...`);

  switch (dataFetchingMethod) {
    case 'AJAX requests':
      await executeAjaxTactics(page);
      break;
    case 'Fetch API':
      await executeFetchAPITactics(page);
      break;
    // Add more tactics for other data fetching methods
  }
}

// Function to execute tactics for handling AJAX requests
async function executeAjaxTactics(page) {
  // Implement tactics to handle AJAX requests and wait for data to be fetched
  // For example, wait for a specific AJAX request to complete or wait for a condition based on AJAX response
  // You can use page.evaluate or page.waitForFunction to check AJAX request status or response data
}

// Function to execute tactics for handling Fetch API
async function executeFetchAPITactics(page) {
  // Implement tactics to handle Fetch API requests and wait for data to be fetched
  // For example, wait for a specific Fetch API request to complete or wait for a condition based on Fetch API response
  // You can use page.evaluate or page.waitForFunction to check Fetch API request status or response data
}

// Function to scroll the page to the end
async function scrollPageToEnd(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const maxScrollAttempts = 10;
      let scrollAttempts = 0;

      const scrollPage = () => {
        if (scrollAttempts >= maxScrollAttempts) {
          resolve();
          return;
        }

        window.scrollBy(0, window.innerHeight);
        scrollAttempts++;

        setTimeout(scrollPage, 100);
      };

      scrollPage();
    });
  });
}

// Function to discover input fields in the page
async function discoverInputFields(page, logStatus) {
  const frameHierarchy = page.mainFrame().childFrames();
  const inputFieldsData = [];

  if (frameHierarchy.length === 0) {
    logStatus('No frames detected. Discovering input fields in the main frame.');
    const inputFields = await discoverInputFieldsInSingleFrame(page, logStatus);
    inputFieldsData.push(...inputFields);
  } else {
    for (const frame of frameHierarchy) {
      logStatus(`Discovering input fields in frame: ${frame.url()}`);
      const frameInputFields = await discoverInputFieldsInSingleFrame(frame, logStatus);
      inputFieldsData.push(...frameInputFields);
    }
  }

  return inputFieldsData;
}

// Function to discover input fields in a single frame
async function discoverInputFieldsInSingleFrame(frame, logStatus) {
    const inputFields = await frame.$$('input');
    const textareas = await frame.$$('textarea');
    const inputFieldsData = [];
  
    for (const inputField of inputFields) {
      const type = await frame.evaluate((node) => node.getAttribute('type'), inputField);
      const name = await frame.evaluate((node) => node.getAttribute('name'), inputField);
      const value = await frame.evaluate((node) => node.getAttribute('value'), inputField);
      const xpath = await frame.evaluate(getElementXPath, inputField);
      const inferredLabel = await getInferredLabel(frame, inputField);
  
      inputFieldsData.push({ type, name, value, xpath, inferredLabel });
    }
  
    for (const textarea of textareas) {
      const type = 'textarea';
      const name = await frame.evaluate((node) => node.getAttribute('name'), textarea);
      const value = await frame.evaluate((node) => node.getAttribute('value'), textarea);
      const xpath = await frame.evaluate(getElementXPath, textarea);
      const inferredLabel = await getInferredLabel(frame, textarea);
  
      inputFieldsData.push({ type, name, value, xpath, inferredLabel });
    }
  
    return inputFieldsData;
  }
  
  // Function to retrieve the inferred label for an input field
  async function getInferredLabel(frame, inputField) {
    const labelElement = await frame.evaluateHandle((input) => {
      let label = input.closest('label');
      if (!label) {
        const id = input.getAttribute('id');
        if (id) {
          label = document.querySelector(`label[for="${id}"]`);
        }
      }
      return label;
    }, inputField);
  
    if (labelElement) {
      const labelText = await frame.evaluate((label) => label.innerText, labelElement);
      return labelText.trim();
    }
  
    return null;
  }
  

// Function to retrieve the XPath of an element
function getElementXPath(element) {
  const idx = (sib, name) =>
    sib ? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName === name) : 1;
  const segs = (elm) =>
    !elm || elm.nodeType !== 1 ? [''] : [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
  return segs(element).join('/');
}
