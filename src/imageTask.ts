import Bull from "bull";
import throng from "throng";
import imageProcessor from "./imageProcessor";
import config from "./config";
let workers = process.env.WEB_CONCURRENCY || 2;

export type JobArgs = {
  propertyImage: {
    id: number;
    original: string;
  };
};

function start() {
  const imageQueue = new Bull<JobArgs>("imageProcessor", config.redisUrl);

  imageQueue.process(imageProcessor);
}

throng({ workers, start });
