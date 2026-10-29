import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { themeClass } from "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found");

createRoot(root).render(
	<React.StrictMode>
		<div className={themeClass}>
			<App />
		</div>
	</React.StrictMode>,
);
