import gradio as gr
import os

def greet(name):
    return "Hello " + name + "!!"

demo = gr.Interface(fn=greet, inputs="text", outputs="text")

# Get Railway's assigned port (default to 7860 if not set)
port = int(os.environ.get("PORT", 7860))

# Launch Gradio on 0.0.0.0 to allow external access
demo.launch(server_name="0.0.0.0", server_port=port)
