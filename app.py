from flask import Flask, render_template
import json

app = Flask(__name__, template_folder='templates') 

def read_json_file(path):
    with open(path, "r") as json_file:
        return json.load(json_file)

@app.route('/')
def home():

    dummy_icons_data = read_json_file("data_files/icons.json")
    dummy_widgets_data = read_json_file("data_files/widgets.json")

    return render_template('base.html', icons_data=dummy_icons_data, widgets_data=dummy_widgets_data)

if __name__ == '__main__': 
    app.run(host="0.0.0.0", port=5000, debug=True)


# ok