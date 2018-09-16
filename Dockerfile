FROM node:8
# Copy app source
COPY . /src
# Set working directory to /src
WORKDIR /src
# Install app dependencies
RUN npm install --only=production
# Expose port to outside world
EXPOSE 3000
# start command as per package.json
CMD ["npm", "start"]