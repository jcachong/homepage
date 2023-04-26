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

	// Click a link to go to another page.
	document.querySelectorAll(".page-link").forEach((link) => {
		link.addEventListener("click", async function(e) {
			e.preventDefault();
			if(!PAGES.includes(this.id)) {
				// Unknown page.
				return;
			}

			const page = this.id;
			const path = page === 'home' ? '/' : `/${page}`;
			if(path === window.location.pathname) {
				// Already on this page.
				return;
			}

			const response = await fetch(`/pages/${page}.html`);
			const html = await response.text();

			// Update page content.
			document.querySelector("#content").innerHTML = html;

			// Update URL.
			window.history.replaceState(null, '', path)
		});
	});

	// Toggle between Dark and Light modes.
	document.querySelector("#toggle-theme").addEventListener("click", (e) => {
		document.querySelector("body").classList.toggle("dark-mode");
	});
};

