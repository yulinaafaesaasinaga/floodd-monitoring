export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <img
            src="/img/logo.png"
            alt="Flood monitoring"
            className={`object-contain ${className}`.trim()}
            {...props}
        />
    );
}
