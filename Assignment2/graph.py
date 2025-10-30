import requests
import networkx as nx
import matplotlib.pyplot as plt

# Configuration: Set the URL of your Floodlight controller
FLOODLIGHT_CONTROLLER_URL = 'http://localhost:8080'  # Change this to your Floodlight controller URL

def fetch_network_topology():
    """Fetch network topology data from the Floodlight controller."""
    links_url = f'{FLOODLIGHT_CONTROLLER_URL}/wm/topology/links/json'
    try:
        response = requests.get(links_url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching topology data: {e}")
        return None

def fetch_host_info():
    links_url = f'{FLOODLIGHT_CONTROLLER_URL}/wm/device/'
    try:
        response = requests.get(links_url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching topology data: {e}")
        return None

def create_graph_from_topology(topology_data):
    """Create a NetworkX graph from the topology data."""
    G = nx.Graph()

    # Add nodes and edges to the graph
    for link in topology_data:
        src_switch = link['src-switch']
        dst_switch = link['dst-switch']
        print(src_switch)

        src_port = link['src-port']
        dst_port = link['dst-port']

        # Add nodes (switches)
        G.add_node(src_switch, label=f"Switch {src_switch}")
        G.add_node(dst_switch, label=f"Switch {dst_switch}")

        # Add edges (links) between nodes
        G.add_edge(src_switch, dst_switch, weight=link.get('bandwidth', 1))  # Add a weight attribute if available

    return G

def create_graph_from_host(topology_data):
    """Create a NetworkX graph from the topology data."""
    for i in topology_data:
        for j in topology_data[i]:
            print(j['ipv4'])


def visualize_graph(G):
    """Visualize the network graph using matplotlib."""
    pos = nx.spring_layout(G)  # Position nodes using the spring layout
    labels = nx.get_node_attributes(G, 'label')
    edge_labels = nx.get_edge_attributes(G, 'weight')

    plt.figure(figsize=(12, 8))
    nx.draw(G, pos, with_labels=True, labels=labels, node_size=2000, node_color='lightblue', font_size=10,
            font_weight='bold', edge_color='gray')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels)
    plt.title('Network Topology')
    plt.show()


def main():
    """Main function to fetch topology, create and visualize the graph."""
    print("Fetching network topology...")
    topology_data = fetch_network_topology()
    host_data = fetch_host_info()

    if topology_data:
        print("Creating graph...")
        G = create_graph_from_topology(topology_data)
        create_graph_from_host(host_data)

        print("Visualizing graph...")
        visualize_graph(G)
    else:
        print("Failed to fetch topology data. Exiting.")


if __name__ == '__main__':
    main()
