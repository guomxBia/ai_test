1)npm install node-llama-cpp
2)
New-Item -ItemType Directory -Force -Path .\models | Out-Null

Invoke-WebRequest -Uri "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf" -OutFile ".\models\tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
3)