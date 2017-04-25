import os, requests, json
from flask import Flask, flash, request, redirect, url_for, send_file

## Setting file upload path to server
UPLOAD_FOLDER = os.getcwd()+'/results/'

## App configuration
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

## Setting the base route
@app.route("/")
def index():
    return send_file("static/index.html")

@app.route("/saveResults", methods=['POST'])
def saveResults():
	try:
		with open('results/results.json') as f:
			current_data = json.load(f)
			#print 'Current data before update: '+str(current_data)
		current_data.append(json.loads(request.data))
		#print 'Current data after update: '+str(current_data)
		with open('results/results.json', 'w') as outfile:
			json.dump(current_data, outfile)						
	except Exception,e:
		  print str(e)

	return request.data

if __name__ == "__main__":
    app.run(host='0.0.0.0')