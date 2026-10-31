/**
 * Asset URL resolver supporting both root hosting and subpath hosting (such as GitHub Pages).
 */
export function getAssetUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Return untouched if already absolute or data URI
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  // Handle legacy /src/assets/images path mapping to public /images
  if (url.startsWith('/src/assets/images/')) {
    return './images/' + url.replace('/src/assets/images/', '');
  }

  // Convert root-relative paths (/images/...) to relative paths (./images/...)
  // so that GitHub Pages subpaths like https://username.github.io/my-repo/ work automatically
  if (url.startsWith('/')) {
    return '.' + url;
  }

  return url;
}
