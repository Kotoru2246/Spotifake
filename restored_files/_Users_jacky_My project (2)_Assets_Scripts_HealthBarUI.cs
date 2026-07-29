

--- VERSION ---

using UnityEngine;
using UnityEngine.UI;

public class HealthBarUI : MonoBehaviour
{
    [Header("UI Reference")]
    [SerializeField] private Slider slider;

    [Header("Health Source (Assign one)")]
    [SerializeField] private PlayerStats playerStats;
    [SerializeField] private EnemyStats enemyStats;

    [Header("Billboard (Optional for World Space Enemy HP Bars)")]
    [Tooltip("Check this if the health bar is on a World Space Canvas floating over the enemy to make it always face the camera.")]
    [SerializeField] private bool faceCamera = false;

    private Transform mainCameraTransform;

    private void Start()
    {
        if (slider == null)
        {
            slider = GetComponent<Slider>();
        }

        if (Camera.main != null)
        {
            mainCameraTransform = Camera.main.transform;
        }

        // Auto-assign references if they are on the same GameObject hierarchy
        if (playerStats == null && enemyStats == null)
        {
            playerStats = GetComponentInParent<PlayerStats>() ?? GetComponentInChildren<PlayerStats>();
            enemyStats = GetComponentInParent<EnemyStats>() ?? GetComponentInChildren<EnemyStats>();
        }
    }

    private void Update()
    {
        if (slider == null)
            return;

        if (playerStats != null)
        {
            slider.maxValue = playerStats.MaxHp;
            slider.value = playerStats.CurrentHp;
        }
        else if (enemyStats != null)
        {
            slider.maxValue = enemyStats.MaxHp;
            slider.value = enemyStats.CurrentHp;
        }
    }

    private void LateUpdate()
    {
        if (faceCamera && mainCameraTransform != null)
        {
            // Always face the camera by looking in the direction of the camera's forward vector
            transform.rotation = Quaternion.LookRotation(mainCameraTransform.forward);
        }
    }
}


--- VERSION ---

        if (UnityEngine.Camera.main != null)
        {
            mainCameraTransform = UnityEngine.Camera.main.transform;
        }