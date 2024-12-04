let isWidgetOpen = false; // Flag to track widget visibility
let widget = document.getElementById('feedback-widget');
let feedbackPanel = document.getElementById('feedback-panel');

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
                const feedbackData = JSON.parse(localStorage.getItem('feedback')) || [];

                // Highlight the selected text
                const span = document.createElement('span');
                span.textContent = selectedText;
                span.className = 'highlighted-feedback';
                span.dataset.feedbackId = feedbackData.length; // Assign ID for linking
                span.style.backgroundColor = '#ffffcc'; // Highlight style
                range.deleteContents(); // Remove original text
                range.insertNode(span); // Insert the highlighted span

                // Store feedback
                feedbackData.push({
                    text: selectedText,
                    feedback: feedback,
                    timestamp: new Date().toISOString(),
                    resolved: false
                });
                localStorage.setItem('feedback', JSON.stringify(feedbackData));

                console.log("Feedback stored:", feedbackData);
                widget.style.display = 'none';
                feedbackTextArea.value = '';
                displayFeedback();
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
    const feedbackData = JSON.parse(localStorage.getItem('feedback')) || [];
    
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
}

function resolveFeedback(index) {
    const feedbackData = JSON.parse(localStorage.getItem('feedback')) || [];
    feedbackData[index].resolved = true;

    console.log("Resolving feedback at index:", index);

    // Find the highlighted text with the matching data-feedback-id
    const highlightedText = document.querySelector(`.highlighted-feedback[data-feedback-id="${index}"]`);
    
    if (highlightedText) {
        console.log("Found highlighted text to remove:", highlightedText.textContent);

        // Clear the highlight style
        highlightedText.style.backgroundColor = ''; 
        highlightedText.classList.remove('highlighted-feedback'); // Optional: Remove the class
    } else {
        console.warn("No highlighted text found for index:", index);
    }

    // Update feedback data in localStorage
    localStorage.setItem('feedback', JSON.stringify(feedbackData));
    displayFeedback();
}

// Initially display feedback
displayFeedback();

document.getElementById('toggle-panel').addEventListener('click', function() {
    const feedbackPanel = document.getElementById('feedback-panel');
    feedbackPanel.classList.toggle('collapsed');
    this.textContent = feedbackPanel.classList.contains('collapsed') ? '+' : '-';
});
