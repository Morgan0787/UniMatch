import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { catalogValue } from '@/lib/catalogCopy';

/** A typographic identity, rather than an invented campus photograph. */
export default function UniversityCover({ university, size = 'default', children = null, actions = null, showName = size !== 'small', heading = 'h3' }) {
  const { language } = useLanguage();
  const Heading = /** @type {React.ElementType} */ (heading);
  const monogram = ((university.name || 'U').match(/[\p{L}\p{N}]+/gu) || ['U']).filter(word => !/^(of|the|and|de|di)$/i.test(word)).slice(0, 3).map(word => Array.from(word)[0]).join('').toUpperCase();
  return <div className={`university-cover university-identity university-identity-${size}`}>
    <span className="university-monogram" aria-hidden="true">{monogram}</span>
    <div className="university-identity-copy">
      {showName && <Heading>{university.name}</Heading>}
      <p>{[(showName || size !== 'small') && university.city, catalogValue(university.country, language)].filter(Boolean).join(' · ')}</p>
      {children}
    </div>
    {actions && <div className="university-identity-actions">{actions}</div>}
  </div>;
}
