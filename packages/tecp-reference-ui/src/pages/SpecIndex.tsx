export function SpecIndex() {
	return (
		<div>
			<h1>Specifications</h1>
			<p>Explore the TECP v0.1 specification materials.</p>

			<div className="card">
				<h2 className="section-title">Core Docs</h2>
				<ul>
					<li><a href="/spec/protocol">Protocol Specification</a></li>
					<li><a href="/spec/threat-model">Threat Model</a></li>
					<li><a href="/spec/test-vectors">Test Vectors</a></li>
					<li><a href="/policies">Policy Registry</a></li>
				</ul>
			</div>

			<div className="card">
				<h2 className="section-title">Tools</h2>
				<ul>
					<li><a href="/verify">Web Verifier</a></li>
					<li><a href="/examples">Code Examples</a></li>
					<li><a href="/log">Transparency Log</a></li>
				</ul>
			</div>
		</div>
	);
}


