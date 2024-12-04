let isWidgetOpen = false; // Flag to track widget visibility
let widget = document.getElementById('feedback-widget');
let feedbackPanel = document.getElementById('feedback-panel');

// Initialize Contentful client (replace with your actual space ID and access token)
import contentful from 'contentful';
const client = contentful.createClient({
    space: 'cdy7uua7fh8z',  // Replace with your actual space ID
    accessToken: 'Ecq6YW7CwG21whqET7H4Yl6oDOPbViFNVf5k4QW3prk'  // Replace with your actual access token
});

document.addEventListener('mouseup', function(event) {
    const selectedText = window.getSelection().toString().trim();
    console.log("Mouseup event triggered, selected text: ", selectedText);

    // If click is inside the feedback panel, don't open widget
    if (feedbackPanel.contains(event.target)) {
        console.log("Click inside feedback panel. Widget will not open.");
        return; // Do nothing if the selection is inside the feedback panel
    }

    if (selectedText.length > 0) {
        const highlightedTextElem = document.getElementById('highlighted-text');
        const feedbackTextArea = document.getElementById('feedback-text');
        highlightedTextElem.textContent = selectedText;

        // Position widget near highlighted text
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        console.log("Widget position calculated: ", rect);

        // Ensure widget is visible
        widget.style.display = 'block';

        // Prevent widget from going off the bottom of the screen
        const widgetHeight = widget.offsetHeight;
        const maxBottom = window.innerHeight - widgetHeight - 10;
        widget.style.top = `${Math.min(rect.bottom + window.scrollY, maxBottom)}px`;

        // Prevent widget from going off the right side of the screen
        const widgetWidth = widget.offsetWidth;
        const maxRight = window.innerWidth - widgetWidth - 10;
        widget.style.left = `${Math.min(rect.left + window.scrollX, maxRight)}px`;

        // Only add click outside listener once the widget is open
        if (!isWidgetOpen && widget.style.display === 'block') {
            isWidgetOpen = true;
            console.log("Widget is now open.");

            // Delay the outside click detection slightly
            setTimeout(function() {
                // Listen for clicks outside the widget to close it
                document.addEventListener('click', handleClickOutside);
            }, 100); // Delay in ms, adjust as necessary
        }

        // Handle the submit feedback action
        document.getElementById('submit-feedback').onclick = function () {
            const feedback = feedbackTextArea.value.trim();
            if (feedback && selectedText) {
                // Retrieve the entry that holds the hidden JSON field for feedback
                client.getEntry('YOUR_ENTRY_ID')  // Replace with your actual entry ID
                    .then(entry => {
                        // Retrieve the existing feedback data from the hidden JSON field
                        const feedbackData = entry.fields.feedback || [];  // Assuming 'feedback' is the hidden JSON field

                        // Create the new feedback object
                        const newFeedback = {
                            text: selectedText,
                            feedback: feedback,
                            timestamp: new Date().toISOString(),
                            resolved: false
                        };

                        // Append the new feedback to the existing data
                        feedbackData.push(newFeedback);

                        // Update the entry with the new feedback
                        entry.fields.feedback = feedbackData;

                        return entry.update();  // Update the entry with new feedback
                    })
                    .then(updatedEntry => {
                        console.log('Feedback submitted to Contentful:', updatedEntry);
                        alert('Thank you for your feedback!');
                        widget.style.display = 'none';
                        feedbackTextArea.value = '';
                        displayFeedback(); // Optionally refresh feedback display
                    })
                    .catch(console.error);
            } else {
                alert('Please select text and enter feedback');
            }
        };
    } else {
        console.log("No text selected.");
    }
});

// Prevent outside click from closing the widget if clicked inside the widget
widget.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent the click from bubbling up to the document
});

function handleClickOutside(event) {
    // Check if the widget is actually visible before checking for outside clicks
    if (widget.style.display === 'block' && !widget.contains(event.target) && !feedbackPanel.contains(event.target)) {
        widget.style.display = 'none';
        isWidgetOpen = false; // Reset flag when widget is closed
        document.removeEventListener('click', handleClickOutside); // Clean up event listener
        console.log("Click outside detected, widget closed.");
    }
}

function displayFeedback() {
    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = ''; // Clear list

    // Fetch the entry with the feedback data from Contentful
    client.getEntry('YOUR_ENTRY_ID')  // Replace with your actual entry ID
        .then(entry => {
            const feedbackData = entry.fields.feedback || [];  // Assuming 'feedback' is the hidden JSON field
            
            feedbackData.forEach((item, index) => {
                // Only display unresolved feedback
                if (item.resolved) {
                    return; // Skip this item if it is resolved
                }

                const feedbackElement = document.createElement('div');
                feedbackElement.classList.add('feedback-item');
                feedbackElement.innerHTML = `
                    <p><strong>Text:</strong> "${item.text}"</p>
                    <p><strong>Feedback:</strong> ${item.feedback}</p>
                    <p>Status: ${item.resolved ? "Resolved" : "Pending"}</p>
                    <button onclick="resolveFeedback(${index})" class="resolved-button" ${item.resolved ? "disabled" : ""}>
                        ${item.resolved ? "Resolved" : "Mark as Resolved"}
                    </button>
                    <hr>
                `;
                
                // Change button color based on resolved status
                const button = feedbackElement.querySelector("button");
                if (item.resolved) {
                    button.style.backgroundColor = "#6c757d"; // grey
                    button.style.cursor = "not-allowed"; // disable cursor
                } else {
                    button.style.backgroundColor = "#28a745"; // green
                    button.style.cursor = "pointer"; // enable cursor
                }

                // Add click event to focus on the highlighted text
                feedbackElement.addEventListener('click', () => {
                    const highlightedText = document.querySelector(
                        `.highlighted-feedback[data-feedback-id="${index}"]`
                    );
                    if (highlightedText) {
                        highlightedText.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        highlightedText.style.outline = '2px solid #007bff'; // Optional focus style
                        setTimeout(() => (highlightedText.style.outline = ''), 2000); // Remove focus style
                    }
                });

                feedbackList.appendChild(feedbackElement);
            });
        })
        .catch(console.error);
}

function resolveFeedback(index) {
    const feedbackList = document.getElementById('feedback-list');
    const feedbackData = feedbackList[index];
    feedbackData.resolved = true;

    console.log("Resolving feedback at index:", index);

    // Update feedback status in Contentful
    client.getEntry('YOUR_ENTRY_ID')  // Replace with your actual entry ID
        .then(entry => {
            // Update the resolved status of the feedback in the hidden JSON field
            const feedbackData = entry.fields.feedback || [];
            feedbackData[index].resolved = true;
            entry.fields.feedback = feedbackData;
            return entry.update();
        })
        .then(updatedEntry => {
            console.log('Feedback resolved in Contentful:', updatedEntry);
            displayFeedback(); // Optionally refresh feedback display
        })
        .catch(console.error);
}

// Initially display feedback
displayFeedback();

document.getElementById('toggle-panel').addEventListener('click', function() {
    const feedbackPanel = document.getElementById('feedback-panel');
    feedbackPanel.classList.toggle('collapsed');
    this.textContent = feedbackPanel.classList.contains('collapsed') ? '+' : '-';
});
