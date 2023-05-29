import requests
from bs4 import BeautifulSoup
from lxml import etree, html

def retrieve_input_fields(url):
    # Send a GET request to retrieve the webpage content
    response = requests.get(url)
    if response.status_code != 200:
        print("Failed to retrieve the webpage. Please check the URL.")
        return

    # Parse the HTML content
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all input elements
    input_elements = soup.find_all(['input', 'textarea', 'select'])

    if not input_elements:
        print("No input fields found on the webpage.")
        return

    # Extract the details for each input field
    for input_element in input_elements:
        input_name = input_element.get('name', '')
        input_type = input_element.get('type', '')
        input_xpath = get_xpath(input_element)

        print("Input Name: ", input_name)
        print("Input Type: ", input_type)
        print("Input XPath: ", input_xpath)
        print()

def get_xpath(element):
    # Build the XPath for the given element using lxml
    lxml_element = html.fromstring(str(element))
    tree = etree.ElementTree(lxml_element)
    xpath = tree.getpath(lxml_element)
    return xpath

# Main entry point
if __name__ == '__main__':
    import sys

    if len(sys.argv) != 2:
        print("Usage: python script.py <url>")
    else:
        url = sys.argv[1]
        retrieve_input_fields(url)
