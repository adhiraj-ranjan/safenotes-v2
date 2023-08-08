from flask import Flask, render_template, request, jsonify, make_response, send_from_directory
from api import user
from waitress import serve

app = Flask(__name__)


@app.route("/")
def login():
    if request.cookies.get("token"):
        return render_template("index.html")
    return render_template("login.html")


@app.route("/signup")
def signup():
    if request.cookies.get("token"):
        return "logged in"
    return render_template("signup.html")


@app.route("/api/__signin", methods=['POST'])
def signin_api_req():
    try:
        uname = request.get_json()['username']
        passwd = request.get_json()['password']
        response = user.validate_user(uname, passwd)
        return jsonify(response)
    except Exception as e:
        return make_response(jsonify({"authenticated": False, "response": str(e)}), 400)


@app.route("/api/__signup", methods=['POST'])
def signup_api_req():
    try:
        uname = request.get_json()['username']
        passwd = request.get_json()['password']
        response = user.new_user(uname, passwd)
        return jsonify(response)
    except Exception as e:
        return make_response(jsonify({"created": False, "response": str(e)}), 400)


@app.route("/api/__get_titles")
def get_notes_titles():
    try:
        token = request.cookies.get("token")
        if token:
            return jsonify({"success": True, "response": user.get_note_titles(uname=user.token_to_uname(token))})
        else:
            return make_response(jsonify({"success": False, "response": "not authorized"}), 403)
    except Exception as e:
        return make_response(jsonify({"success": False, "response": str(e)}), 400)


@app.route("/api/__get_data", methods=['POST'])
def get_data():
    try:
        token = request.cookies.get("token")
        file_name = request.get_json()['name']
        return user.get_data(user.token_to_uname(token), file_name)
    except Exception as e:
        return make_response(jsonify({"success": False, "response": str(e)}), 400)


@app.route("/api/__get_logs", methods=['POST'])
def get_logs():
    try:
        token = request.cookies.get("token")
        return user.get_user_logs(user.token_to_uname(token))
    except Exception as e:
        return make_response(jsonify({"success": False, "response": str(e)}), 400)

@app.route("/api/__update_note", methods=['POST'])
def save_data():
    try:
        token = request.cookies.get("token")
        file_name = request.get_json()["name"]
        value = request.get_json()["data"]
        return user.update_note(fname=file_name, data=value, uname=user.token_to_uname(token))
    except Exception as e:
        return make_response(jsonify({"updated": False, "response": str(e)}), 400)

@app.route("/api/__logout", methods=["POST"])
def __logout():
    try:
        token = request.cookies.get("token")
        response = user.logout(token)
        resp = make_response(response)
        resp.set_cookie("token")
        return resp
    except Exception as e:
        return make_response(jsonify({"logged_out": False, "response": str(e)}), 400)

@app.route("/api/__delete_note", methods=['POST'])
def delete_note():
    try:
        token = request.cookies.get("token")
        file_name = request.get_json()["name"]
        return user.delete_note(user.token_to_uname(token), fname=file_name)
    except Exception as e:
        return make_response(jsonify({"deleted": False, "response": str(e)}), 400)


@app.route("/api/__create_note", methods=['POST'])
def create_project():
    try:
        token = request.cookies.get("token")
        file_name = request.get_json()["name"]
        return user.create_note(file_name, user.token_to_uname(token))
    except Exception as e:
        return make_response(jsonify({"created": False, "response": str(e)}), 400)

@app.route("/favicon.ico")
def return_favicon():
    return send_from_directory("static/images/", "favicon.ico")

if __name__ == "__main__":
    serve(app, host="0.0.0.0")

