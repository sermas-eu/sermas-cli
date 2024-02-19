import { Command } from 'commander';
import { MqttClient } from 'mqtt';
import { CommandParams } from '../../libs/dto/cli.dto';
import logger from '../../libs/logger';
import { fail, toJSON, waitInterrupt } from '../../libs/util';

export default {
  setup: async (command: Command) => {
    command
      .description('Subscribe to a topic')
      .argument(
        '<topic...>',
        `The topic(s) to subscribe in the form 'app/<appId>/resource/scope[/more]'. Specify more topics separated by space. Wildcard are supported.`,
      );
  },

  run: async ({ args, api }: CommandParams) => {
    const argTopics = args;

    const topics: string[] = (argTopics || []).map((topic) => {
      const parts = (topic || '').split('/');
      if (parts.length < 3 || parts[0] !== 'app')
        return fail(
          `topic ${topic} must follow the pattern 'app/<appId>/resource/scope[/more]'`,
        );
      return topic;
    });

    const res = await api.getPlatformUserSettings();
    if (res === null) return;

    const interrupt = waitInterrupt();

    const clients: Record<string, MqttClient> = {};

    for (const topic of topics) {
      const [, appId, resource, scope] = topic.split('/');

      const subTopics = [];
      const baseTopic = `app/${appId}`;
      if (resource === '*') {
        subTopics.push(
          ...Object.keys(res.resources)
            .map((resource) =>
              res.resources[resource].map(
                (scope) => `${baseTopic}/${resource}/${scope}`,
              ),
            )
            .flat(),
        );
      } else if (scope === '*') {
        subTopics.push(
          ...res.resources[resource].map(
            (scope) => `${baseTopic}/${resource}/${scope}`,
          ),
        );
      } else {
        subTopics.push(topic);
      }

      logger.debug(`Retrieving app client`);
      const appApi = await api.getAppClient(appId);

      let client = clients[appId];
      if (!clients[appId]) {
        try {
          logger.debug(`Connecting to ${appId}`);
          client = await appApi.connectMqtt(appId);
        } catch (e) {
          return fail(`[${appId}] MQTT error: ${e.stack}`);
        }

        if (client === null) return fail();

        clients[appId] = client;

        client.on('message', (topic, message, packet) => {
          let data = '[binary]';
          let properties = '';
          if (packet.properties) {
            properties = JSON.stringify(packet.properties);
          }
          try {
            const json = JSON.parse(message.toString());
            data = toJSON(json);
          } catch {
          } finally {
            logger.info(`${topic}: ${data} [${properties}]`);
          }
        });
      }

      subTopics.forEach((topic) => {
        client.subscribe(topic, (err) => {
          if (err)
            return logger.error(`[${topic}] Subscribe failed: ${err.stack}`);
          logger.debug(`Subscribed to ${topic}`);
        });
      });
    }

    await interrupt;
  },
};
