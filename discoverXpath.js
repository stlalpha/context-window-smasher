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
      await executeDataFetchingTactics(page, dataFetchingMethods);
      logStatus('Tactics execution complete.');
    } else {
      logStatus('No dynamic elements detected. Proceeding with radio button discovery.');
    }

    logStatus('Scrolling to load additional content...');
    await scrollPageToEnd(page);
    logStatus('Scrolling complete.');

    logStatus('Discovering radio buttons...');
    const radioButtonsData = await discoverRadioButtons(page, logStatus);
    logStatus('Radio button discovery complete.');

    logStatus('Radio button data:');
    console.log(radioButtonsData);
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

// Function to execute tactics based on the detected data fetching methods
async function executeDataFetchingTactics(page, dataFetchingMethods) {
  // Execute tactics based on the detected data fetching methods
  if (dataFetchingMethods.includes('AJAX requests')) {
    await executeAjaxTactics(page);
  }

  if (dataFetchingMethods.includes('Fetch API')) {
    await executeFetchAPITactics(page);
  }

  // Add more tactics for other data fetching methods
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

// Function to discover radio buttons in the page
async function discoverRadioButtons(page, logStatus) {
  const frameHierarchy = page.mainFrame().childFrames();

  if (frameHierarchy.length === 0) {
    logStatus('No frames detected. Discovering radio buttons in the main frame.');
    const radioButtons = await discoverRadioButtonsInSingleFrame(page, logStatus);
    return radioButtons;
  } else {
    const radioButtons = [];
    for (const frame of frameHierarchy) {
      logStatus(`Discovering radio buttons in frame: ${frame.url()}`);
      const frameRadioButtons = await discoverRadioButtonsInSingleFrame(frame, logStatus);
      radioButtons.push(...frameRadioButtons);
    }
    return radioButtons;
  }
}

// Function to discover radio buttons in a single frame
async function discoverRadioButtonsInSingleFrame(frame, logStatus) {
  const potentialRadioButtons = await frame.$$('[type="radio"]');
  const radioButtonsData = [];

  for (const radioButton of potentialRadioButtons) {
    const name = await getRadioButtonName(radioButton, logStatus);
    const xpath = await frame.evaluate(getElementXPath, radioButton);
    radioButtonsData.push({ name, xpath });
  }

  return radioButtonsData;
}

// Function to retrieve the name of a radio button
async function getRadioButtonName(radioButton, logStatus) {
  const nameAttribute = await radioButton.evaluate((node) => node.getAttribute('name'));
  if (nameAttribute) {
    logStatus(`Name found using 'name' attribute: ${nameAttribute}`);
    return nameAttribute;
  } else {
    const ariaLabelAttribute = await radioButton.evaluate((node) => node.getAttribute('aria-label'));
    if (ariaLabelAttribute) {
      logStatus(`Name found using 'aria-label' attribute: ${ariaLabelAttribute}`);
      return ariaLabelAttribute;
    } else {
      const ariaLabelledByAttribute = await radioButton.evaluate((node) =>
        node.getAttribute('aria-labelledby')
      );
      if (ariaLabelledByAttribute) {
        const labelledByElement = await radioButton.evaluateHandle(
          (node, id) => node.ownerDocument.getElementById(id),
          ariaLabelledByAttribute
        );
        if (labelledByElement) {
          const labelledByText = await labelledByElement.evaluate((node) => node.innerText.trim());
          logStatus(`Name found using 'aria-labelledby' attribute: ${labelledByText}`);
          return labelledByText;
        }
      }
    }
  }
}

// Function to retrieve the XPath of an element
function getElementXPath(element) {
  const idx = (sib, name) =>
    sib ? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName === name) : 1;
  const segs = (elm) =>
    !elm || elm.nodeType !== 1 ? [''] : [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
  return segs(element).join('/');
}
