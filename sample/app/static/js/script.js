// document.addEventListener("DOMContentLoaded", function() {
//     var form = document.querySelector(".search-section .search-bar");
//     var input = form.querySelector("input[name='ai']");
//     var timeline = document.getElementById("loadingTimeline");

//     form.addEventListener("submit", function(event) {
//         event.preventDefault(); // Prevent form from submitting normally
//         timeline.classList.add("visible"); // Show the loading timeline

//         // Simulate a loading process (e.g., fetching data)
//         setTimeout(function() {
//             timeline.classList.remove("visible"); // Hide timeline after loading is done
//             // Here, you would typically handle the actual form submission,
//             // like sending the input value to your server or processing it further.
//             console.log("Processed query:", input.value);
//         }, 2000); // Adjust this timeout to match your actual loading time
//     });
// });

document.addEventListener("DOMContentLoaded", function() {
    var form = document.querySelector(".search-section .search-bar");
    var timeline = document.getElementById("loadingTimeline");

    form.addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent form from submitting normally

        // Show the loading timeline
        timeline.classList.add("visible");

        // Example asynchronous operation: Fetching data from an API
        // This is where you would typically include your actual data fetching logic
        // For demonstration, I'm using a placeholder for an asynchronous fetch operation
        fetch('https://your-api-endpoint.com/data')
            .then(response => response.json())
            .then(data => {
                console.log("Data fetched:", data);
                // Process your data here

                // Hide the timeline after data is fetched and processed
                timeline.classList.remove("visible");
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                // Hide the timeline even if there's an error
                timeline.classList.remove("visible");
            });

        // Note: Replace the URL 'https://your-api-endpoint.com/data' with your actual API endpoint
    });
});


