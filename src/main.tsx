import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Public marketing theme. Scoped to `html.site`, so the admin panel and login
// screen keep the tokens declared in index.css. Imported first so Tailwind
// utility classes always win over the site component classes below.
import "./styles/site-theme.css";
import "./index.css";
import { logoPath as appLogo } from '@/components/Logo';

// Dynamically replace any existing favicon & apple touch icon with our app logo
const ensureFavicon = () => {
	const head = document.head;
	const rels = [
		{ rel: 'icon', sizes: '32x32' },
		{ rel: 'apple-touch-icon' }
	];
	rels.forEach(cfg => {
		let link = head.querySelector<HTMLLinkElement>(`link[rel='${cfg.rel}']` + (cfg.sizes ? `[sizes='${cfg.sizes}']` : ''));
		if (!link) {
			link = document.createElement('link');
			link.rel = cfg.rel;
			if (cfg.sizes) link.sizes = cfg.sizes;
			head.appendChild(link);
		}
		link.href = appLogo;
	});
};

ensureFavicon();

// Remove the initial HTML loader once React has mounted, so users never see the
// raw prerendered/unstyled content flash before the app paints.
const removeInitialLoader = () => {
	const loader = document.getElementById('app-loader');
	if (!loader) return;
	loader.style.opacity = '0';
	loader.style.transition = 'opacity 0.3s ease';
	window.setTimeout(() => loader.remove(), 300);
};

createRoot(document.getElementById("root")!).render(<App />);

// requestAnimationFrame fires after the first paint, ensuring the app is visible
// underneath before we fade the loader out.
requestAnimationFrame(() => requestAnimationFrame(removeInitialLoader));
