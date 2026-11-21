import { Fragment } from "react";
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
      {lines.map((line, i) => (<Fragment key={i}>{i > 0 ? " " : null}<span className="line-mask">
          <span className="line-inner">{line}</span>
        </span></Fragment>))}
    </span>);
}
