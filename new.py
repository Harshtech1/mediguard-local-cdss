import streamlit as st
from openai import OpenAI

# 1. Setup the Page
st.set_page_config(page_title="Harsh's Radeon AI", page_icon="🤖")
st.title("AMD Radeon Powered Chat")
st.subheader("Local Qwen 2.5-0.5B Session")

# 2. Connect to the ACTIVE Foundry Port (52437)
# Note: Keep the Foundry PowerShell window open!
client = OpenAI(base_url="http://127.0.0.1:64281/v1", api_key="not-needed")

# 3. Initialize Chat History
if "messages" not in st.session_state:
    st.session_state.messages = []

# 4. Display Chat History
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 5. Chat Input
if prompt := st.chat_input("Ask your local AI..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 6. Get Response from your GPU via DirectML
    try:
        with st.chat_message("assistant"):
            response = client.chat.completions.create(
                model="qwen2.5-0.5b-instruct-generic-gpu:4",
                messages=st.session_state.messages
            )
            full_response = response.choices[0].message.content
            st.markdown(full_response)
        
        st.session_state.messages.append({"role": "assistant", "content": full_response})
    except Exception as e:
        st.error(f"Connection Failed! Check if the Foundry window is still open. Error: {e}")