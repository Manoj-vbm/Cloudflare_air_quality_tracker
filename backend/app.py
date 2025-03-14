from flask import Flask, request, jsonify
import requests
import oci
import os

app = Flask(__name__)

@app.route('/api/air-pollution', methods=['GET'])
def get_air_pollution():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHERMAP_API_KEY')
    url = f'https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}'

    try:
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to fetch air pollution data', 'details': str(e)}), 500

@app.route('/api/cities', methods=['POST'])
def store_city_data():
    data = request.get_json()
    name = data.get('name')
    lat = data.get('lat')
    lon = data.get('lon')

    client = oci.object_storage.ObjectStorageClient({
        'user': os.getenv('OCI_USER'),
        'fingerprint': os.getenv('OCI_FINGERPRINT'),
        'key_file': os.getenv('OCI_KEY_FILE'),
        'tenancy': os.getenv('OCI_TENANCY'),
        'region': os.getenv('OCI_REGION')
    })

    try:
        result = client.put_object(
            namespace_name=os.getenv('OCI_NAMESPACE'),
            bucket_name=os.getenv('OCI_BUCKET'),
            object_name=f'{name}.json',
            put_object_body=json.dumps({'name': name, 'lat': lat, 'lon': lon})
        )
        return jsonify({'message': 'City data stored successfully', 'result': result.data})
    except oci.exceptions.ServiceError as e:
        return jsonify({'error': 'Failed to store city data', 'details': str(e)}), 500

@app.route('/api/cities', methods=['GET'])
def get_city_data():
    client = oci.object_storage.ObjectStorageClient({
        'user': os.getenv('OCI_USER'),
        'fingerprint': os.getenv('OCI_FINGERPRINT'),
        'key_file': os.getenv('OCI_KEY_FILE'),
        'tenancy': os.getenv('OCI_TENANCY'),
        'region': os.getenv('OCI_REGION')
    })

    try:
        result = client.list_objects(
            namespace_name=os.getenv('OCI_NAMESPACE'),
            bucket_name=os.getenv('OCI_BUCKET')
        )
        cities = []
        for obj in result.data.objects:
            city_data = client.get_object(
                namespace_name=os.getenv('OCI_NAMESPACE'),
                bucket_name=os.getenv('OCI_BUCKET'),
                object_name=obj.name
            )
            cities.append(json.loads(city_data.data.text))
        return jsonify(cities)
    except oci.exceptions.ServiceError as e:
        return jsonify({'error': 'Failed to retrieve city data', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
