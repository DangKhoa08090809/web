import google.generativeai as genai

genai.configure(api_key="AIzaSyCePHV2RmVMBTfKvNXhJNr8WIkQvHSD7zc")

# Thử gọi danh sách model
models = list(genai.list_models())

for m in models:
    print(m.name, "=>", m.supported_generation_methods)
