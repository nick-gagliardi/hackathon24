// HTML for the widget
const widgetHtml = `
<div id="feedback-widget">
    <p>Selected Text: <span id="highlighted-text"></span></p>
    <textarea id="feedback-text" rows="4" cols="30" placeholder="Leave your feedback here..."></textarea>
    <br>
    <button id="submit-feedback">Submit Feedback</button>
</div>
<div id="feedback-panel">
    <button id="toggle-panel">-</button>
    <h3>Feedback Panel</h3>
    <div id="feedback-list"></div>
</div>
`;

// Inject the HTML into the page
document.body.insertAdjacentHTML('beforeend', widgetHtml);

// CSS for styling the widget
const widgetStyle = document.createElement('style');
widgetStyle.textContent = `
    #feedback-widget {
        position: fixed;
        background: #fff;
        padding: 16px;
        z-index: 1000;
        display: none;
        font-family: Arial, sans-serif;
        width: 300px;
        max-width: 90%;
        box-sizing: border-box;
        transition: all 0.3s ease-in-out;
        max-height: 60vh;
        overflow-y: auto;
    }

    #feedback-widget h4 {
        margin: 0;
        color: #333;
        font-size: 1em;
    }

    #highlighted-text {
        font-size: 0.9em;
        color: #555;
        margin: 8px 0;
        background: #efefef;
        padding: 8px;
        border-radius: 4px;
    }

    #feedback-text {
        width: 100%;
        height: 60px;
        padding: 8px;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.9em;
        box-sizing: border-box;
    }

    #submit-feedback {
        width: 100%;
        padding: 8px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    #submit-feedback:hover {
        background: #0056b3;
    }

    #feedback-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 320px;
        background: #fff;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        height: 80%;
        overflow-y: auto;
        z-index: 999;
        transition: all 0.3s ease-in-out;
    }

    #feedback-panel.collapsed {
        width: 40px;
        height: 40px;
        overflow: hidden;
        padding: 5px;
        text-align: center;
    }

    .feedback-item {
        background: #f9f9f9;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
    }

    .resolved-button {
        background: #28a745;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
    }

    .resolved-button:hover {
        background: #218838;
    }

    .highlighted-feedback {
        background-color: #ffffcc;
        cursor: pointer;
        border-radius: 2px;
    }
`;
document.head.appendChild(widgetStyle);

// JavaScript functionality for the widget
let isWidgetOpen = false;
let widget = document.getElementById('feedback-widget');
let feedbackPanel = document.getElementById('feedback-panel');

document.addEventListener('mouseup', function(event) {
    const selectedText = window.getSelection().toString().trim();

    if (feedbackPanel.contains(event.target)) return;

    if (selectedText.length > 0) {
        const highlightedTextElem = document.getElementById('highlighted-text');
        const feedbackTextArea = document.getElementById('feedback-text');
        highlightedTextElem.textContent = selectedText;

        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        widget.style.display = 'block';
        const widgetHeight = widget.offsetHeight;
        const maxBottom = window.innerHeight - widgetHeight - 10;
        widget.style.top = `${Math.min(rect.bottom + window.scrollY, maxBottom)}px`;

        const widgetWidth = widget.offsetWidth;
        const maxRight = window.innerWidth - widgetWidth - 10;
        widget.style.left = `${Math.min(rect.left + window.scrollX, maxRight)}px`;

        if (!isWidgetOpen && widget.style.display === 'block') {
            isWidgetOpen = true;
            setTimeout(function() {
                document.addEventListener('click', handleClickOutside);
            }, 100);
        }

        document.getElementById('submit-feedback').onclick = function () {
            const feedback = feedbackTextArea.value.trim();
            if (feedback && selectedText) {
                const feedbackData = JSON.parse(localStorage.getItem('feedback')) || [];

                const span = document.createElement('span');
                span.textContent = selectedText;
                span.className = 'highlighted-feedback';
                span.dataset.feedbackId = feedbackData.length;
                span.style.backgroundColor = '#ffffcc';
                range.deleteContents();
                range.insertNode(span);

                feedbackData.push({
                    text: selectedText,
                    feedback: feedback,
                    timestamp: new Date().toISOString(),
                    resolved: false
                });
                localStorage.setItem('feedback', JSON.stringify(feedbackData));

                widget.style.display = 'none';
                feedbackTextArea.value = '';
                displayFeedback();
            } else {
                alert('Please select text and enter feedback');
            }
        };
    }
});

widget.addEventListener('click', function(event) {
    event.stopPropagation();
});

function handleClickOutside(event) {
    if (widget.style.display === 'block' && !widget.contains(event.target) && !feedbackPanel.contains(event.target)) {
        widget.style.display = 'none';
        isWidgetOpen = false;
        document.removeEventListener('click', handleClickOutside);
    }
}

function displayFeedback() {
    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = '';
    const feedbackData = JSON.parse(localStorage.getItem('feedback')) || [];
    
    feedbackData.forEach((item, index) => {
        if (item.resolved) return;

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
        
        feedbackElement.addEventListener('click', () => {
            const highlightedText = document.querySelector(`.highlighted-feedback[data-feedback-id="${index}"]`);
            if (highlightedText) {
                highlightedText.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlightedText.style.outline = '2px solid #007bff';
                setTimeout(() => (highlightedText.style.outline = ''), 2000);
            }
        });

        feedbackList.appendChild(feedbackElement);
    });
}

function resolveFeedback(index) {
    const feedbackData = JSON.parse(localStorage.getItem('feedback')) || [];
    feedbackData[index].resolved = true;

    const highlightedText = document.querySelector(`.highlighted-feedback[data-feedback-id="${index}"]`);
    
    if (highlightedText) {
        highlightedText.style.backgroundColor = ''; 
        highlightedText.classList.remove('highlighted-feedback');
    }

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
