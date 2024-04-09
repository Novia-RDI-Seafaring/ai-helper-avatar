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
                    const imageWidth = 1045 // 1684
                    const imageHeight = 784 // 1191

                    this.#displayMessageHistory(data.message_history);
                    const {status, focus_point, degrees, bboxes} = data

                    if (focus_point !== null) {
                        focus_point[0] /= imageWidth;
                        focus_point[1] /= imageHeight;
                    }
                    
                    context.avatar.handleMessage(context, {status, focus_point, direction: degrees});
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
        messageElement.innerHTML = `<pre class="messageText">${message}</pre><pre class="messageTime">${new Date().toLocaleTimeString()}</pre>`;
        chat.appendChild(messageElement);

        // Scroll to the bottom of the chat window
        chatUI.scrollTop = chatUI.scrollHeight;
    }

    #displayMessageHistory(messageHistory) {
        const chatUI = document.querySelector('.chat-ui');
        const chat = document.querySelector('.chat');

        // Get the last message from the history
        const lastMessage = messageHistory[messageHistory.length - 1];

        const messageElement = document.createElement('div');
        const type = lastMessage.is_user ? 'outgoing' : 'incoming';
        messageElement.className = 'message ' + type;
        messageElement.innerHTML = `<pre class="messageText">${lastMessage.message}</pre><pre class="messageTime">${new Date().toLocaleTimeString()}</pre>`;
        chat.appendChild(messageElement);

        // Scroll to the bottom of the chat window
        chatUI.scrollTop = chatUI.scrollHeight;
    }
}
