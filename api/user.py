import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import time
from uuid import uuid4
from os import environ
from json import loads
from base64 import b64decode
from urllib.parse import quote

CREDS = loads(b64decode(environ['CREDS_ENCODED']).decode()) 

cred = credentials.Certificate(CREDS)
firebase_admin.initialize_app(cred, {
    "databaseURL": environ['DATABASE_URL']
}
)

user = db.reference("/users")
token = db.reference("/tokens")


def token_to_uname(sToken):
    return token.child(sToken).get()


def validate_user(uname, passwd):
    user_password = user.child(quote(uname, safe='')).child("password").get()
    if user_password:
        if passwd == user_password:
            sessionToken = str(uuid4())
            token.update({sessionToken: uname})
            return {"authenticated": True, "response": "logged in", "authtoken": sessionToken}
        
        return {"authenticated": False, "response": "Password is incorrect"}
    
    return {"authenticated": False, "response": "User not found"}


def new_user(uname, passwd):
    user_password = user.child(quote(uname, safe='')).get()
    if not user_password:
        user.update({uname: {"password": passwd, "id": int(
            time.time()), "last_viewed": "story"}})
        create_note(fname="story", uname=uname)
        update_note(
            fname="story", data="             It was a dark and stormy night...", uname=uname)
        return {"created": True, "response": "signup success, redirecting to login page..."}
    
    return {"created": False, "response": "Username already taken"}


def get_note_titles(uname):
    noteTls = user.child(quote(uname, safe='')).child("notes").get()
    if not noteTls:
        return []
    
    return list(noteTls.keys())


def create_note(fname, uname):
    if not uname:
        return {"created": False, "response": "Note was not created"}

    if user.child(quote(uname, safe='')).child("notes").child(quote(fname, safe='')).get() is None:
        user.child(quote(uname, safe='')).child("notes").update({fname: ""})
        return {"created": True, "response": "Note created"}
    
    return {"created": False, "response": "Note with the name already exists"}


def get_data(uname, fname):
    if not uname:
        return {"success": False, "response": "not found"}

    data = user.child(quote(uname, safe='')).child("notes").child(quote(fname, safe='')).get()
    if data == "" or data:
        user.child(quote(uname, safe='')).update({"last_viewed": fname})
        return {"success": True, "response": data}
    
    return {"success": False, "response": "not found"}


def update_note(fname, data, uname):
    if not uname:
        return {"updated": False, "response": "note was not saved"}

    user.child(quote(uname, safe='')).child("notes").update({fname: data})
    return {"updated": True, "response": "saved"}


def get_user_logs(uname):
    if not uname:
        return {"success": False, "last_viewed": "", "value": ""}

    last_note = user.child(quote(uname, safe='')).get()['last_viewed']
    return {"success": True, "last_viewed": last_note}


def logout(sToken):
    if sToken:
        token.child(sToken).delete()
        return {"logged_out": True}
    
    return {"logged_out": False, "response": "token not found"}


def delete_note(uname, fname):
    if not uname:
        return {"deleted": False, "response": "Invalid user"}

    if user.child(quote(uname, safe='')).child("notes").child(quote(fname, safe='')).get() is not None:
        user.child(quote(uname, safe='')).child("notes").child(quote(fname, safe='')).delete()
        return {"deleted": True, "response": "Note was deleted"}
    
    return {"deleted": False, "response": "Note not found"}
