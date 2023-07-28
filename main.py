from flask import Flask, render_template, request, jsonify
from api import user

app = Flask(__name__)

@app.route("/")
def login():
    if request.cookies.get("token"):
        return "logged in"
    return render_template("login.html")

@app.route("/signup")
def signup():
    if request.cookies.get("token"):
        return "logged in"
    return render_template("signup.html")

@app.route("/api/signin", methods=['POST'])
def signin_api_req():
    try:
        uname = request.get_json()['username']
        passwd = request.get_json()['password']
        response = user.validate_user(uname, passwd)
        return jsonify(response)
    except:
        return jsonify({"authenticated": False, "response": "Something went wrong"})

@app.route("/api/signup", methods=['POST'])
def signup_api_req():
    try:
        uname = request.get_json()['username']
        passwd = request.get_json()['password']
        response = user.new_user(uname, passwd)
        return jsonify(response)
    except:
        return jsonify({"created": False, "response": "Something went wrong"})

if __name__=="__main__":
    app.run("0.0.0.0", debug=True)