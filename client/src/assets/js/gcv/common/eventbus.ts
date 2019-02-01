// basic implementation of a publish-subscribe eventbus
class EventBus {

  private subscribers = [];

  subscribe(callback) {
    const index = this.subscribers.push(callback) - 1;

    return {
      unsubscribe: () => {
        delete this.subscribers[index];
      }
    }
  }

  publish(event) {
    this.subscribers.forEach((callback) => callback(event));
  }
}

// singleton
export const eventBus = new EventBus();
