import os
import traceback
from flask import Blueprint, jsonify
from database.db import execute, get_db

forecast_bp = Blueprint('forecast', __name__)

# ══════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════
WINNING_MODEL = 'mlp'
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

_state = {
    'loaded': False,
    'model':  None,
    'scaler': None,
    'window': 7,
    'error':  None,
    'np': None,
    'MinMaxScaler': None,
    'MLPRegressor': None,
}


def _ensure_ml_dependencies():
    if _state['np'] and _state['MinMaxScaler'] and _state['MLPRegressor']:
        return True

    try:
        import numpy as np
        from sklearn.preprocessing import MinMaxScaler
        from sklearn.neural_network import MLPRegressor

        _state['np'] = np
        _state['MinMaxScaler'] = MinMaxScaler
        _state['MLPRegressor'] = MLPRegressor
        _state['error'] = None
        return True
    except Exception as exc:
        _state['error'] = str(exc)
        print(f"[forecast] Dependency load error: {exc}")
        traceback.print_exc()
        return False

# ══════════════════════════════════════════════════════════
# RETRAINING ENGINE
# ══════════════════════════════════════════════════════════

def _retrain_model(sales_data):
    """Takes raw sales list, trains the model, and updates _state"""
    try:
        if not _ensure_ml_dependencies():
            return False

        print("[forecast] Retraining MLP model with latest database records...")
        np = _state['np']
        MinMaxScaler = _state['MinMaxScaler']
        MLPRegressor = _state['MLPRegressor']

        # 1. Prepare Data
        data = np.array(sales_data).reshape(-1, 1)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(data).flatten()

        window = _state['window']
        X, y = [], []
        for i in range(window, len(scaled_data)):
            X.append(scaled_data[i-window:i])
            y.append(scaled_data[i])

        X, y = np.array(X), np.array(y)

        # 2. Build and Train MLP (similar capability to simple LSTM for time series)
        model = MLPRegressor(
            hidden_layer_sizes=(64, 32),
            activation='relu',
            solver='adam',
            max_iter=500,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=20,
        )
        model.fit(X, y)

        # 3. Update Global State
        _state['model'] = model
        _state['scaler'] = scaler
        _state['loaded'] = True
        print("[forecast] Retraining Complete.")
        return True
    except Exception as e:
        print(f"[forecast] Retrain Error: {e}")
        traceback.print_exc()
        return False

# ══════════════════════════════════════════════════════════
# DATA HELPERS
# ══════════════════════════════════════════════════════════

def _get_daily_sales():
    conn = get_db()
    cur = conn.cursor()
    execute(cur, '''
        SELECT date, SUM(total) as total_sales
        FROM sales
        WHERE total > 0
        GROUP BY date
        ORDER BY date ASC
    ''')
    rows = cur.fetchall()
    conn.close()
    return [r['total_sales'] for r in rows]


def _run_forecast(sales, steps=7):
    if not _ensure_ml_dependencies():
        raise RuntimeError(_state['error'] or 'Forecast dependencies are unavailable.')

    np = _state['np']
    model = _state['model']
    window = _state['window']
    scaler = _state['scaler']

    scaled = scaler.transform(np.array(sales).reshape(-1, 1)).flatten()
    inp = scaled[-window:].copy()
    preds = []

    for _ in range(steps):
        p = model.predict(inp.reshape(1, -1))[0]
        preds.append(p)
        inp = np.append(inp[1:], p)

    # Inverse scaling to get real peso amounts
    unscaled_preds = scaler.inverse_transform(np.array(preds).reshape(-1, 1)).flatten()
    return [round(float(v), 2) for v in unscaled_preds]


def _label(amount):
    if amount <= 0:
        return 'No data'
    elif amount < 5000:
        return 'Low activity week'
    elif amount < 15000:
        return 'Moderate sales week'
    else:
        return 'Active sales week'

# ══════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════

@forecast_bp.route('/forecast', methods=['GET'])
def get_forecast():
    sales = _get_daily_sales()

    if not _ensure_ml_dependencies():
        return jsonify({'error': 'Forecast service is unavailable', 'details': _state['error']}), 503

    # Validation: Need enough data to fill the "Window"
    if len(sales) < _state['window']:
        return jsonify({'error': f'Need at least {_state["window"]} days of data.'}), 400

    # Retrain every time the endpoint is called
    success = _retrain_model(sales)
    if not success:
        return jsonify({'error': 'Model training failed'}), 500

    forecast = _run_forecast(sales)
    recommended_budget = round(sum(forecast), 2)

    return jsonify({
        'model': WINNING_MODEL + ' prediction',
        'forecast': forecast,
        'recommended_budget': recommended_budget,
        'budget_label': _label(recommended_budget),
        'recent_sales': [round(float(v), 2) for v in sales[-30:]],
        'total_history_days': len(sales),
    }), 200


@forecast_bp.route('/forecast/budget', methods=['GET'])
def get_budget():
    sales = _get_daily_sales()
    if not _ensure_ml_dependencies():
        return jsonify({'recommended_budget': 0, 'label': 'Forecast service unavailable'}), 503

    if len(sales) < _state['window']:
        return jsonify({'recommended_budget': 0, 'label': 'Insufficient data'}), 400

    # Ensure model is ready
    if not _state['loaded']:
        _retrain_model(sales)

    forecast = _run_forecast(sales)
    total = round(sum(forecast), 2)

    return jsonify({
        'recommended_budget': total,
        'label': _label(total),
        'model': 'MLP (Dynamic)'
    }), 200
