from flask import Flask, jsonify, request
import pandas as pd
import re
import os
import subprocess

def populate_data_folder(data_folder):
    if not os.path.exists(data_folder):
        os.makedirs(data_folder)
    conspiracy_resource_dataset = "https://raw.githubusercontent.com/SystemsLab-Sapienza/conspiracy-dataset-telegram/main/conspiracy_resource_dataset.csv"
    conspiracy_resource_dataset_supplementary_url = "https://raw.githubusercontent.com/SystemsLab-Sapienza/conspiracy-dataset-telegram/main/conspiracy_resource_dataset_supplementary.csv"
    conspiracy_resource_dataset = pd.read_csv(conspiracy_resource_dataset)
    conspiracy_resource_dataset_supplementary = pd.read_csv(conspiracy_resource_dataset_supplementary_url)
    for platform in ["voat", "8kun", "reddit", "website", "youtube", "supplementary"]:
        if platform != "supplementary":
            tmp = conspiracy_resource_dataset[conspiracy_resource_dataset["platform"] == platform]
        if platform == "voat":
            tmp = tmp["resource"].apply(lambda x: f"voat.co/{x}")
        if platform == "8kun":
            tmp = tmp["resource"].apply(lambda x: f"8kun.top/{x}")
        if platform == "reddit":
            tmp = tmp["resource"].apply(lambda x: f"reddit.com/r/{x}")
        if platform == "website":
            tmp = tmp["resource"]
        if platform == "youtube":
            tmp = tmp["resource"]
        if platform == "supplementary":
            tmp = conspiracy_resource_dataset_supplementary["youtube_video"].dropna()
        tmp.to_csv(os.path.join(data_folder, f"{platform}.txt"), index=False, header=False)

def clear_url(url):
    # Remove the protocol
    url = re.sub(r"^https?://", "", url)
    # Remove the www
    url = re.sub(r"^www\.", "", url)
    # Strip the trailing slash
    url = url.rstrip("/")
    return url

def contains_substring(string, filename):
    # Execute the grep command
    try:
        # -F to treat the lines as fixed strings
        # -q to not print output, only the exit code
        # -f to specify the file containing the substrings
        result = subprocess.run(
            ["grep", "-F", "-i", "-f", filename],
            input=string,
            text=True
        )
        # If the exit code is 0, it means a match was found
        if result.returncode == 0:
            return True
        else:
            return False
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

populate_data_folder("data")
conspiracy_url_dataset_url = "https://raw.githubusercontent.com/SystemsLab-Sapienza/conspiracy-dataset-telegram/main/conspiracy_url_dataset.csv"
conspiracy_url_dataset = pd.read_csv(conspiracy_url_dataset_url)

app = Flask(__name__)

@app.route("/", methods=["POST"])
def url_evaluation():
    url = request.json["url"]
    result = {
        "url": url,
        "conspiracy_resource_dataset": False,
        "conspiracy_url_dataset": False
    }
    url = clear_url(url)
    if url in conspiracy_url_dataset["url"].values:
        result["conspiracy_url_dataset"] = True
    for platform in ["voat", "8kun", "reddit", "website", "youtube", "supplementary"]:
        filename = f"data/{platform}.txt"
        if contains_substring(url, filename):
            result["conspiracy_resource_dataset"] = True
    print(
        "------------------\n"
        f"URL: {url}\n"
        f"conspiracy_url_dataset: {result["conspiracy_url_dataset"]}\n"
        f"conspiracy_resource_dataset: {result["conspiracy_resource_dataset"]}"
        "\n------------------"
    )
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)