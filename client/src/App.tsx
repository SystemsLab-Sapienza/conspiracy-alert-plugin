import React, { useEffect, useMemo } from "react";
import logo from "./logo.png"

interface Response {
  url: string | null,
  conspiracy_resource_dataset: boolean,
  conspiracy_url_dataset: boolean
}

function App() {

  // load the response from the background script
  const [response, setResponse] = React.useState<Response>({
    url: null,
    conspiracy_resource_dataset: false,
    conspiracy_url_dataset: false
  });
  useEffect(() => {
    // get the response from the background script
    chrome.storage.local.get(["response"], (result) => {
      if (result.response) {
        console.log("Response loaded", result.response);
        setResponse(result.response);
      }
    });
  }, []);

  // get the current tab url
  const [currentUrl, setCurrentUrl] = React.useState<string | null>(null);
  useEffect(() => {
    // get the current tab url
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].url) {
        setCurrentUrl(tabs[0].url);
      }
    });
  }, []);

  // set the text based on the response
  const text = useMemo(() => {
    if (response.url !== null && response.url.toString().replace(/\/+$/, "") === currentUrl?.replace(/\/+$/, "")) {
      if (response.conspiracy_url_dataset === true) {
        return "This URL is considered a conspiracy URL."
      }
      if (response.conspiracy_resource_dataset === true) {
        return "This URL has matched a conspiracy resource."
      } 
      if (response.conspiracy_resource_dataset === false && response.conspiracy_url_dataset === false) {
        return "This URL is safe."
      }
    }
    return "Loading..."
  }, [response, currentUrl]);

  // check if the website is dangerous based on the response
  const isDangerous = useMemo(() => { 
    if (response.url !== null && response.url.toString().replace(/\/+$/, "") === currentUrl?.replace(/\/+$/, "")) {
      if (response.conspiracy_url_dataset === true) {
        return true
      }
      if (response.conspiracy_resource_dataset === true) {
        return true
      } 
      if (response.conspiracy_resource_dataset === false && response.conspiracy_url_dataset === false) {
        return false
      }
    }
    return null
  }, [response, currentUrl]);

  // set the message based on the response
  const message = useMemo(() => {
    if (isDangerous === null) {
      return (
        // loading message
        <div className="bg-yellow-100 text-yellow-900 px-4 py-2 mt-4 rounded-md">
          <p>
            {text}
          </p>
        </div>
      );
    } else if (isDangerous === true) {
      return (
        // dangerous message
        <div className="bg-red-100 text-red-900 px-4 py-2 mt-4 rounded-md">
          <p>
            {text}
          </p>
        </div>
      );
    } else if (isDangerous === false) {
      return (
        // safe message
        <div className="bg-green-100 text-green-900 px-4 py-2 mt-4 rounded-md">
          <p>
            {text}
          </p>
        </div>
      );
    }
    return null
  }, [text, isDangerous]);

  // render the app
  return (
    <div className="min-w-80 min-h-40 flex flex-col justify-center items-center m-4">
      <img src={logo} alt="logo" className="w-20 h-20" />
      <h1 className="text-2xl font-bold">
        Conspiracy Alert
      </h1>
      {message}
      <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded-md" onClick={() => window.close()}>
        close
      </button>
    </div>
  )
}

export default App
