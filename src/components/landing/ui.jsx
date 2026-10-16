import { ArrowUpRight } from "lucide-react";
export function Action({ children, href = undefined, onClick = undefined, light = false, className = "", }) {
    const contents = (<>
      <span className="action-label">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
      <span className="action-arrow">
        <ArrowUpRight size={18}/>
        <ArrowUpRight size={18} aria-hidden="true"/>
      </span>
    </>);
    return href ? (<a className={`action ${light ? "action-light" : ""} ${className}`} href={href}>
      {contents}
    </a>) : (<button className={`action ${light ? "action-light" : ""} ${className}`} onClick={onClick}>
      {contents}
    </button>);
}
export function Lines({ lines, className = "", }) {
    return (<span className={className}>
      {lines.map((line, i) => (<span className="line-mask" key={i}>
          <span className="line-inner">{line}</span>
        </span>))}
    </span>);
}
