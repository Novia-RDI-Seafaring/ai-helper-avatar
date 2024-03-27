document.addEventListener('DOMContentLoaded', function() {
    var sendButton = document.getElementById('send');
    var inputField = document.querySelector('input[name="ai"]');
    var chatUI = document.querySelector('.chat');
    var loadingIndicator = document.getElementById('loadingIndicator');

    sendButton.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the form from submitting normally

        var userInput = inputField.value;
        if (userInput.trim() === '') return; // Do not send empty queries

        // Show loading indicator
        loadingIndicator.style.display = 'block';

        // Display the user's query in the chat
        displayMessage(userInput, 'outgoing');

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
        messageElement.className = 'message ' + type; // Different classes for styling incoming/outgoing messages
        messageElement.innerHTML = `<p class="messageText">${message}</p><p class="messageTime">${new Date().toLocaleTimeString()}</p>`;
        chatUI.appendChild(messageElement);
    }

    function displayMessageHistory(messageHistory) {
        var lastMessage = messageHistory[messageHistory.length - 1]; // Get the last message from the history
        var type = lastMessage.is_user ? 'outgoing' : 'incoming'; // Determine the type of message

        var messageElement = document.createElement('div');
        messageElement.className = 'message ' + type;
        messageElement.innerHTML = `<p class="messageText">${lastMessage.message}</p><p class="messageTime">${new Date().toLocaleTimeString()}</p>`;
        chatUI.appendChild(messageElement);
    }
});
