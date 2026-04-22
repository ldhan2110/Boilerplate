FROM ghcr.io/eugenmayer/kontextwork-converter:production

# Copy your custom fonts
COPY fonts/ /usr/local/share/fonts/custom/

# Rebuild font cache
RUN fc-cache -fv