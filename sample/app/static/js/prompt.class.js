export default class Prompt {
    constructor(context) {
        const chatInputForm = document.querySelector('.search-bar');
        const sendButton = document.querySelector('.send');
        const inputField = document.querySelector('input[name="ai"]');
        const loadingIndicator = document.querySelector('.loading-state');

        const sendForm = () => {
            const userInput = inputField.value;

            // Do not send empty queries
            if (userInput.trim() === '') {
                return;
            }

            // Display the user's query in the chat
            this.#displayMessage(userInput, 'outgoing');

            // Show loading indicator
            loadingIndicator.style.display = 'block';

            // Start avatar thinking animation
            context.avatar.startThinking(context);

            // Send the request to the server
            fetch('./ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: userInput,
            })
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    // Hard-coded for debuging.. fix this later!
                    const WIDTH = 1045 // 1684
                    const HEIGHT = 784 // 1191

                    this.#displayMessageHistory(data.message_history);
                    const { status, focus_point, degrees, bboxes } = data
                    console.log('original fp:', focus_point)
                    // points to upper right corner of bbox
                    // focus_point[0] = bboxes[0][0] / WIDTH 
                    // focus_point[1] = bboxes[0][0] / HEIGHT 
                    if (focus_point !== null) {
                        focus_point[0] /= WIDTH;
                        focus_point[1] /= HEIGHT;
                    }
                    //focus_point[0] = parseInt(focus_point[0] / WIDTH * 100)
                    //focus_point[1] = parseInt(focus_point[1] / HEIGHT * 100)
                    console.log("this is the bbox", bboxes)
                    console.log("this is the first elemnt of bbox", bboxes[0][0])
                    console.log("This the final focus point", focus_point[0], focus_point[1])

                    context.avatar.handleMessage(context, { status, focus_point, direction: degrees });
                    context.whiteboard.loadPdf(context, bboxes)
                })
                .catch(e => {
                    console.error(e);

                    context.avatar.startIdling();

                    this.#displayMessage('There was an error reading the message', 'error');
                })
                .finally(() => {
                    // Hide loading indicator
                    loadingIndicator.style.display = 'none';
                });

            // Clear the input field
            inputField.value = '';
        }

        sendButton.addEventListener('click', event => {
            event.preventDefault();
            sendForm();
        });

        chatInputForm.addEventListener('submit', event => {
            event.preventDefault();
            sendForm();
        });
    }

    #displayMessage(message, type) {
        const chatUI = document.querySelector('.chat-ui');
        const chat = document.querySelector('.chat');

        const messageElement = document.createElement('div');
        // Apply different classes (first and second child) for styling incoming/outgoing messages
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `<p class="messageText">${message}</p><pre class="messageTime">${new Date().toLocaleTimeString()}</p>`;
        chat.appendChild(messageElement);

        // Scroll to the bottom of the chat window
        chatUI.scrollTop = chatUI.scrollHeight;
    }

    #displayMessageHistory(messageHistory) {
        const chatUI = document.querySelector('.chat-ui');
        const chat = document.querySelector('.chat');

        if (messageHistory.length === 0) return; // Exit if there's no history

        // Get the last message from the history
        const lastMessage = messageHistory[messageHistory.length - 1];
        const type = lastMessage.is_user ? 'outgoing' : 'incoming';

        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + type;

        // Check if the message is intended to be displayed as a list
        // const isList = lastMessage.message.toLowerCase().includes('list of items:');
        const isList = lastMessage.message.split('\n').some(line => line.trim().startsWith('-'));
        if (isList) {
            messageElement.innerHTML = `<pre class="messageText">${lastMessage.message}</pre><pre class="messageTime">${new Date().toLocaleTimeString()}</pre>`;
        } else {
            messageElement.innerHTML = `<p class="messageText">${lastMessage.message}</p><pre class="messageTime">${new Date().toLocaleTimeString()}</pre>`;
        }
        chat.appendChild(messageElement);

        // Scroll to the bottom of the chat window
        chatUI.scrollTop = chatUI.scrollHeight;
    }

}
