window.onload = (e) => {
	const PAGES = [
		'home',
		'about',
		'site',
	];
	document.querySelector("#contact").addEventListener("click", (e) => {
		// Display contact information.
		// Try to hide it from bots.
		const spans = document.querySelector("#contact-secret").querySelectorAll("span");
		if(!spans[0].textContent) {
			const name = document.querySelector("h1").textContent;
			const names = name.split(' ');
			const username = (names[0][0] + names[1][1] + names[1]).toLowerCase();
			spans[4].textContent = 'com';
			spans[3].textContent = 'dot';
			spans[2].textContent = 'gmail';
			spans[1].textContent = 'at';
			spans[0].textContent = username;
		}
		spans.forEach((span) => {
			span.classList.toggle('fade');
		});
	});

	let localListeners = [];
	const refreshLocalListeners = () => {
		const contentElem = document.querySelector("#content");

		// Remove local listeners from elements.
		localListeners.forEach((elem) => {
			elem.removeEventListener("click", handlePageLinkClick);
		});
		localListeners = [];

		// Add listeners to new link elements.
		contentElem.querySelectorAll(".page-link").forEach((link) => {
			addPageLinkListener(link);
			localListeners.push(link);
		});
	};

	const handlePageLinkClick = async function(e) {
		e.preventDefault();
		const href = this.href.split('/').pop();
		const page = href === '' ? 'home' : href;
		if(!PAGES.includes(page)) {
			// Unknown page.
			return;
		}

		const path = page === 'home' ? '/' : `/${page}`;
		if(path === window.location.pathname) {
			// Already on this page.
			return;
		}

		const contentElem = document.querySelector("#content");
		contentElem.style.opacity = '0';
		const startTime = new Date();
		const response = await fetch(`/pages/${page}.html`);
		const html = await response.text();
		const endTime = new Date();
		const timeElapsed = endTime - startTime;
		// Magic number 200ms matches #content opacity transition in CSS.
		const waitMs = Math.max(0, 200 - timeElapsed);
		setTimeout(() => {
			// Update page content.
			contentElem.innerHTML = html;
			contentElem.style.opacity = '100';

			// Update URL.
			window.history.replaceState(null, '', path)

			refreshLocalListeners();
		}, waitMs);
	};

	const addPageLinkListener = (link) => {
		link.addEventListener("click", handlePageLinkClick);
	};

	// Click a link to go to another page.
	const addPageLinkListeners = (parentSelector) => {
		const parentElem = document.querySelector(parentSelector);
		const pageLinks = parentElem.querySelectorAll(".page-link");
		pageLinks.forEach(addPageLinkListener);
	};

	addPageLinkListeners("footer");
	addPageLinkListeners("#nav-bar");

	refreshLocalListeners();

	// Toggle between Dark and Light modes.
	document.querySelector("#toggle-theme").addEventListener("click", (e) => {
		document.querySelector("body").classList.toggle("dark-mode");
	});

	window.addEventListener("keydown", (event) => {
		const scrollBy = 40;
		switch(event.keyCode) {
			case 75: // k
				window.scrollBy(0, -scrollBy);
				break;
			case 74: // j
				window.scrollBy(0, scrollBy);
				break;
			default:
				break;
		}
	});
};

