FROM ubuntu AS Final
RUN apt update
RUN apt install -y apt-utils
RUN apt install -y curl
RUN apt install -y curl software-properties-common gnupg
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
RUN apt install -y git

WORKDIR /src
ADD https://api.github.com/repos/BabysbreathJJ/hpc-rest-bvt/compare/master...HEAD /dev/null
RUN git clone https://github.com/BabysbreathJJ/hpc-rest-bvt.git
WORKDIR /src/hpc-rest-bvt
RUN npm install
ENTRYPOINT ["npm", "start"]