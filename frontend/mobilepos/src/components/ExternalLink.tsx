import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

type LinkProps = React.ComponentProps<typeof Link>;

type ExternalLinkProps = Omit<LinkProps, 'href'> & { href: string };

export function ExternalLink({ href, ...props }: ExternalLinkProps) {
  return (
    <Link
      target="_blank"
      {...props}
      href={href as LinkProps['href']}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          WebBrowser.openBrowserAsync(href);
        }
      }}
    />
  );
}
