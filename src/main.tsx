import { createRoot } from "react-dom/client";
import App from "./App.tsx";
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

createRoot(document.getElementById("root")!).render(<App />);
