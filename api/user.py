import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import time
from uuid import uuid4
from os import environ
from json import loads
from base64 import b64decode

CREDS = loads(b64decode(environ['CREDS_ENCODED']).decode())

cred = credentials.Certificate(CREDS)
firebase_admin.initialize_app(cred, {
    "databaseURL": environ['DATABASE_URL']
    }
)

user = db.reference("/users")
token = db.reference("/tokens")

def token_to_uname(sToken):
    tokens = token.get()
    if sToken in tokens.keys():
        return tokens[sToken]
    else:
        return False


def validate_user(uname, passwd):
    if uname in user.get().keys():
        if passwd == user.child(uname).get()['password']:
            sessionToken = str(uuid4())
            token.update({sessionToken: uname})
            return {"authenticated": True, "response": "logged in", "authtoken": sessionToken}
        else:
            return {"authenticated": False, "response": "Password is incorrect"}
    else:
        return {"authenticated": False, "response": "User not found"}

def new_user(uname, passwd):
    if uname not in user.get().keys():
        user.update({uname: {"password": passwd, "id": int(time.time()), "last_viewed": "story"}})
        create_note(fname="story", uname=uname)
        update_note(fname="story", data="             It was a dark and stormy night...", uname=uname)
        return {"created": True, "response": "signup success, redirecting to login page..."}
    else:
        return {"created": False, "response": "Username already taken"}

def get_note_titles(uname=None):
    noteTls = user.child(uname).child("notes").get()
    if not noteTls:
        return []
    else:
        return noteTls.keys()
    

def create_note(fname, uname=None):
    if not uname:
        return {"created": False, "response": "Note was not created"}

    if fname not in get_note_titles(uname=uname):
        user.child(uname).child("notes").update({fname: ""})
        return {"created": True}
    else:
        return {"created": False, "response": "Note with the name already exists"}
    

def update_note(fname, data, uname=None):
    if not uname:
        return {"status": "fail", "response": "note was not saved"}
    
    user.child(uname).child("notes").update({fname: data})
    return {"status": "ok", "response": "note updated"}