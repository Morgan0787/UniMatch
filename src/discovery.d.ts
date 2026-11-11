declare module 'virtual:seo-discovery-links' {
  const links: import('./lib/discoveryContent.js').DiscoveryLink[];
  export const publicPaths: string[];
  export default links;
}
