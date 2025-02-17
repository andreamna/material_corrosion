import gradio as gr
import os

def classify_corrosion(image):
    # Replace with actual processing logic
    return "8"  # Example predicted corrosion level

# Create an API endpoint
app = gr.Interface(
    fn=classify_corrosion,
    inputs="image",
    outputs="text",
    live=True
)

# Use Railway's assigned port
port = int(os.environ.get("PORT", 7860))

# Launch API-only server (no UI)
app.launch(server_name="0.0.0.0", server_port=port, share=False)
