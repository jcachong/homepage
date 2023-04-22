window.onload = (e) => {
	document.querySelector("#contact").addEventListener("click", (e) => {
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
		} else {
			spans.forEach((span) => {
				span.textContent = '';
			});
		}
	});
};

