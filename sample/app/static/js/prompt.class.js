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
            const url = `/ask?query=${encodeURIComponent(userInput)}`;
            const request = new Request(url);
            fetch(request)
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    // hard-coded for debuging.. fix this later!
                    const WIDTH = 1045 // 1684
                    const HEIGHT = 784 // 1191

                    this.#displayMessageHistory(data.message_history);
                    const {status, focus_point, degrees, bboxes} = data

                    // points to upper right corner of bbox
                    focus_point[0] = bboxes[0][0] / WIDTH 
                    focus_point[1] = bboxes[0][0] / HEIGHT 
                    //focus_point[0] = parseInt(focus_point[0] / WIDTH * 100)
                    //focus_point[1] = parseInt(focus_point[1] / HEIGHT * 100)
                    console.log("this is the bbox", bboxes)
                    console.log("this is the first elemnt of bbox", bboxes[0][0])
                    console.log("This the final focus point", focus_point[0], focus_point[1])
                    

                    context.avatar.handleMessage(context, {status, focus_point, direction:degrees});
                    context.whiteboard._loadPdf(context, bboxes)
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
        messageElement.innerHTML = `<p class="messageText">${message}</p><p class="messageTime">${new Date().toLocaleTimeString()}</p>`;
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
        messageElement.innerHTML = `<p class="messageText">${lastMessage.message}</p><p class="messageTime">${new Date().toLocaleTimeString()}</p>`;
        chat.appendChild(messageElement);

        // Scroll to the bottom of the chat window
        chatUI.scrollTop = chatUI.scrollHeight;
    }
}
