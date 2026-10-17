FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM dependencies AS build
COPY index.html vite.config.js ./
COPY public ./public
COPY src/client ./src/client
RUN npm run build
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY src/server ./src/server
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","src/server/index.js"]
