document.addEventListener('DOMContentLoaded', function() {
    var sendButton = document.getElementById('send');
    var inputField = document.querySelector('input[name="ai"]');
    var chatUI = document.querySelector('.chat');
    var loadingIndicator = document.getElementById('loadingState');
    let chat = document.querySelector('.chatUI');



    // Send the user's query to the server when the user clicks the send button
    sendButton.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the form from submitting normally

        var userInput = inputField.value;
        if (userInput.trim() === '') return; // Do not send empty queries

        // Display the user's query in the chat
        displayMessage(userInput, 'outgoing');

        // Show loading indicator
        loadingIndicator.style.display = 'block'; // TODO: Show the loading indicator (current one not necessary, but it's a good practice to show the user that something is happening in the background)


        // Send the request to the server
        var url = '/ask?query=' + encodeURIComponent(userInput);
        var myRequest = new Request(url);
        fetch(myRequest)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                // Hide loading indicator
                loadingIndicator.style.display = 'none';
                
                displayMessageHistory(data.message_history);
            });

        inputField.value = ''; // Clear the input field
    });

    function displayMessage(message, type) {
        var messageElement = document.createElement('div');
        messageElement.className = 'message ' + type; // I apply different classes (first and second child) for styling incoming/outgoing messages
        messageElement.innerHTML = `<p class="messageText">${message}</p><p class="messageTime">${new Date().toLocaleTimeString()}</p>`;
        chatUI.appendChild(messageElement);
        
        chat.scrollTop = chat.scrollHeight; // Scroll to the bottom of the chat window

    }

    function displayMessageHistory(messageHistory) {
        var lastMessage = messageHistory[messageHistory.length - 1]; // Get the last message from the history
        var type = lastMessage.is_user ? 'outgoing' : 'incoming'; // Determine the type of message

        var messageElement = document.createElement('div');
        messageElement.className = 'message ' + type;
        messageElement.innerHTML = `<p class="messageText">${lastMessage.message}</p><p class="messageTime">${new Date().toLocaleTimeString()}</p>`;
        chatUI.appendChild(messageElement);

        // Scroll to the bottom of the chat window
        chat.scrollTop = chat.scrollHeight;
    }
});
