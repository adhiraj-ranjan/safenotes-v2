from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def login():
    return render_template("login.html")

@app.route("/signup")
def signup():
    return render_template("signup.html")

@app.route("/api/signin", methods=['POST'])
def signin_api_req():
    return jsonify({"status": "ok"})

@app.route("/api/signup", methods=['POST'])
def signup_api_req():
    return jsonify({"status": "ok"})

if __name__=="__main__":
    app.run("0.0.0.0", debug=True)